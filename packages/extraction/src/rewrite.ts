import type { ImportMap } from '@navita/types';
import MagicString from 'magic-string';
import {
  collectArgumentIdents,
  createLineColumnLookup,
  getCalleeName,
  getInitCalleeName,
  importedName,
  type Node,
  patternNames,
  walk,
} from './ast';
import { getParser } from './loadOxc';

const COLLECT_RESULT_NAME = 'collectResult';
const ADAPTER_SOURCE = '@navita/adapter';

type Options = {
  filename: string;
  importMap: ImportMap;
};

type KeptItem =
  | { kind: 'statement'; node: Node }
  | { kind: 'exprCall'; node: Node };

/**
 * The core extraction rewrite. Produces an ES module (still TypeScript, still
 * pre-AMD) where:
 *  - every navita style call is wrapped in `collectResult({ ... })`,
 *  - the module is pruned to only the imports + statements needed to evaluate
 *    those calls (with nested style declarations hoisted to the top level),
 *  - unresolved free identifiers referenced inside style calls are synthesized
 *    as bare `let x;` declarations.
 *
 * This mirrors the behavior of the original Rust/swc-plugin transform (see the
 * `test!` fixtures in crates/extraction/src/lib.rs).
 */
export function rewrite(
  code: string,
  { filename, importMap }: Options,
): string {
  const { program } = getParser().parseSync(filename, code, {
    lang: 'tsx',
    sourceType: 'module',
  });
  const body: Node[] = program.body;

  // ---------------------------------------------------------------------------
  // Phase A — identify the local bindings that refer to navita style callees,
  // and the full set of import-bound names.
  // ---------------------------------------------------------------------------
  const importCalls = new Set<string>(); // local names bound to a navita callee
  const importBindings = new Set<string>(); // every import local name

  for (const stmt of body) {
    if (stmt.type !== 'ImportDeclaration' || stmt.importKind === 'type') {
      continue;
    }
    const source = stmt.source.value as string;
    for (const spec of stmt.specifiers || []) {
      importBindings.add(spec.local.name);
      if (spec.type !== 'ImportSpecifier' || spec.importKind === 'type') {
        continue;
      }
      const imported = importedName(spec);
      for (const entry of importMap) {
        if (entry.source === source && entry.callee === imported) {
          importCalls.add(spec.local.name);
        }
      }
    }
  }

  const isMatchedCall = (node: Node): boolean =>
    node.type === 'CallExpression' &&
    importCalls.has(getCalleeName(node) ?? '\0');

  // ---------------------------------------------------------------------------
  // Phase B — collect identifiers referenced inside the arguments of every
  // matched style call. These are the free variables the calls depend on.
  // ---------------------------------------------------------------------------
  const usedIdents = new Set<string>();
  walk(program, (node) => {
    if (isMatchedCall(node)) {
      collectArgumentIdents(node.arguments, usedIdents);
    }
  });

  // ---------------------------------------------------------------------------
  // Phase C — collect the statements we keep, hoisting nested style decls and
  // recording the "identifier" label (declared name) for each matched call.
  // ---------------------------------------------------------------------------
  const moduleImports: Node[] = [];
  const keptItems: KeptItem[] = [];
  const callIdentifier = new Map<Node, string>();

  /** Decide whether to keep a VariableDeclaration; records identifier labels. */
  const computeVarDeclKeep = (varDecl: Node): boolean => {
    let keep = false;
    for (const decl of varDecl.declarations) {
      const initCallee = getInitCalleeName(decl.init);
      if (initCallee !== null && importCalls.has(initCallee)) {
        keep = true;
        const names = patternNames(decl.id);
        const label = names[0] ?? '';
        // Map each matched call in the init to the declared name.
        walkMatched(decl.init, isMatchedCall, (call) => {
          callIdentifier.set(call, label);
        });
      }

      for (const name of patternNames(decl.id)) {
        if (usedIdents.has(name)) {
          usedIdents.delete(name);
          keep = true;
        }
      }
    }
    return keep;
  };

  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) {
        visit(child);
      }
      return;
    }

    switch (node.type) {
      case 'ImportDeclaration': {
        for (const spec of node.specifiers || []) {
          usedIdents.delete(spec.local.name);
        }
        moduleImports.push(node);
        return; // imports are leaves here
      }
      case 'VariableDeclaration': {
        if (computeVarDeclKeep(node)) {
          keptItems.push({ kind: 'statement', node });
        } else {
          visitChildren(node);
        }
        return;
      }
      case 'ExportNamedDeclaration': {
        if (
          node.declaration &&
          node.declaration.type === 'VariableDeclaration'
        ) {
          if (computeVarDeclKeep(node.declaration)) {
            keptItems.push({ kind: 'statement', node });
          } else {
            visitChildren(node.declaration);
          }
          return;
        }
        visitChildren(node);
        return;
      }
      case 'FunctionDeclaration': {
        visitChildren(node);
        if (node.id && usedIdents.has(node.id.name)) {
          keptItems.push({ kind: 'statement', node });
          usedIdents.delete(node.id.name);
        }
        return;
      }
      case 'ClassDeclaration': {
        visitChildren(node);
        if (node.id && usedIdents.has(node.id.name)) {
          keptItems.push({ kind: 'statement', node });
          usedIdents.delete(node.id.name);
        }
        return;
      }
      case 'CallExpression': {
        if (isMatchedCall(node)) {
          keptItems.push({ kind: 'exprCall', node });
          return; // do not descend into a matched call
        }
        visitChildren(node);
        return;
      }
      default:
        visitChildren(node);
    }
  };

  const visitChildren = (node: Node): void => {
    for (const key in node) {
      if (key === 'type' || key === 'start' || key === 'end') {
        continue;
      }
      const value = node[key];
      if (value && typeof value === 'object') {
        visit(value);
      }
    }
  };

  for (const stmt of body) {
    visit(stmt);
  }

  // Leftover free identifiers become bare `let x;` declarations (hoist fallback).
  const leftoverLets = [...usedIdents];

  // ---------------------------------------------------------------------------
  // Phase D — rewrite matched calls into collectResult(...) and assemble.
  // ---------------------------------------------------------------------------
  const magic = new MagicString(code);
  const lineColumn = createLineColumnLookup(code);
  let index = 0;

  const rewriteCall = (call: Node): void => {
    const identifier = callIdentifier.get(call) ?? '';
    const start = call.start;
    const end = call.end;
    const { line, column } = lineColumn(start);
    const original = code.slice(start, end);

    const replacement =
      `${COLLECT_RESULT_NAME}({\n` +
      `  filePath: ${JSON.stringify(filename)},\n` +
      `  index: ${index},\n` +
      `  identifier: ${JSON.stringify(identifier)},\n` +
      `  position: [${start}, ${end}],\n` +
      `  sourceMap: {\n` +
      `    line: ${line},\n` +
      `    column: ${column}\n` +
      `  },\n` +
      `  result: () => ${original}\n` +
      `})`;

    magic.update(start, end, replacement);
    index += 1;
  };

  // Index assignment order = order matched calls appear in the rebuilt body.
  for (const item of keptItems) {
    walkMatched(item.node, isMatchedCall, rewriteCall);
  }

  const parts: string[] = [];
  parts.push(
    `import { ${COLLECT_RESULT_NAME} as ${COLLECT_RESULT_NAME} } from "${ADAPTER_SOURCE}";`,
  );
  for (const imp of moduleImports) {
    parts.push(magic.slice(imp.start, imp.end));
  }
  for (const name of leftoverLets) {
    parts.push(`let ${name};`);
  }
  for (const item of keptItems) {
    const sliced = magic.slice(item.node.start, item.node.end);
    parts.push(item.kind === 'exprCall' ? `${sliced};` : sliced);
  }

  return parts.join('\n');
}

/**
 * Depth-first visit of matched calls, NOT descending into a matched call's own
 * subtree (mirrors the swc visitor which replaces the node without recursing).
 */
function walkMatched(
  node: any,
  isMatched: (n: Node) => boolean,
  fn: (call: Node) => void,
): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      walkMatched(child, isMatched, fn);
    }
    return;
  }
  if (node.type === 'CallExpression' && isMatched(node)) {
    fn(node);
    return; // do not descend into the matched call
  }
  for (const key in node) {
    if (key === 'type' || key === 'start' || key === 'end') {
      continue;
    }
    const value = node[key];
    if (value && typeof value === 'object') {
      walkMatched(value, isMatched, fn);
    }
  }
}
