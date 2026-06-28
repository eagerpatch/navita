import { importedName, type Node, patternNames } from "./ast";
import { getParser } from "./loadOxc";

type Options = {
  /** Drop imports whose bindings are not referenced in the body (entry points). */
  dropUnusedImports: boolean;
};

type ImportSpec =
  | { kind: "named"; imported: string; local: string }
  | { kind: "default"; local: string }
  | { kind: "namespace"; local: string };

type SourceInfo = { source: string; specs: ImportSpec[]; param: string };

/**
 * Convert an ES module (already TypeScript-stripped) into a single AMD
 * `define([...deps], function (require, exports, ...modules) { ... })` call
 * expression — the shape `@navita/core`'s evaluator expects.
 */
export function esmToAmd(code: string, { dropUnusedImports }: Options): string {
  const { program } = getParser().parseSync("module.js", code, { lang: "js", sourceType: "module" });
  const body: Node[] = program.body;

  // Gather imports keyed by source (preserving source order).
  const sources: SourceInfo[] = [];
  const sourceIndex = new Map<string, SourceInfo>();
  const sideEffectSources: string[] = [];

  const sourceInfoFor = (source: string): SourceInfo => {
    let info = sourceIndex.get(source);
    if (!info) {
      info = { source, specs: [], param: "" };
      sourceIndex.set(source, info);
      sources.push(info);
    }
    return info;
  };

  for (const stmt of body) {
    if (stmt.type !== "ImportDeclaration") {
      continue;
    }
    const source = stmt.source.value as string;
    const specifiers = stmt.specifiers || [];
    if (specifiers.length === 0) {
      sideEffectSources.push(source);
      continue;
    }
    const info = sourceInfoFor(source);
    for (const spec of specifiers) {
      if (spec.type === "ImportDefaultSpecifier") {
        info.specs.push({ kind: "default", local: spec.local.name });
      } else if (spec.type === "ImportNamespaceSpecifier") {
        info.specs.push({ kind: "namespace", local: spec.local.name });
      } else {
        info.specs.push({ kind: "named", imported: importedName(spec), local: spec.local.name });
      }
    }
  }

  // Reference set for dead-import elimination: every identifier name used
  // outside of import declarations (over-inclusive — safe direction).
  const referenced = new Set<string>();
  if (dropUnusedImports) {
    for (const stmt of body) {
      if (stmt.type === "ImportDeclaration") {
        continue;
      }
      collectIdentifierNames(stmt, referenced);
    }
  }

  // Decide which imports survive and prune unused specifiers.
  const keptSources: SourceInfo[] = [];
  for (const info of sources) {
    const specs = dropUnusedImports
      ? info.specs.filter((s) => referenced.has(s.local))
      : info.specs;
    if (specs.length === 0) {
      continue;
    }
    info.specs = specs;
    keptSources.push(info);
  }

  // Side-effect imports are kept only when we are not pruning (passthrough).
  const keptSideEffects = dropUnusedImports ? [] : sideEffectSources;

  // Assign AMD parameter names.
  keptSources.forEach((info, i) => {
    info.param = `_navita_import_${i}`;
  });
  const sideEffectParams = keptSideEffects.map((_, i) => `_navita_side_${i}`);

  const deps = [
    '"require"',
    '"exports"',
    ...keptSources.map((info) => JSON.stringify(info.source)),
    ...keptSideEffects.map((source) => JSON.stringify(source)),
  ];
  const params = [
    "require",
    "exports",
    ...keptSources.map((info) => info.param),
    ...sideEffectParams,
  ];

  // Build the factory body.
  const lines: string[] = [];

  for (const info of keptSources) {
    lines.push(...destructure(info));
  }

  for (const stmt of body) {
    if (stmt.type === "ImportDeclaration") {
      continue;
    }
    emitStatement(stmt, code, lines);
  }

  const bodyText = lines.join("\n");

  return `define([${deps.join(", ")}], function (${params.join(", ")}) {\n${bodyText}\n})`;
}

function destructure(info: SourceInfo): string[] {
  const lines: string[] = [];
  const named: string[] = [];
  for (const spec of info.specs) {
    if (spec.kind === "named") {
      named.push(spec.imported === spec.local ? spec.local : `${spec.imported}: ${spec.local}`);
    } else if (spec.kind === "namespace") {
      lines.push(`const ${spec.local} = ${info.param};`);
    } else {
      // default import interop (handles both ESM default and CJS module.exports)
      lines.push(
        `const ${spec.local} = ${info.param} && ${info.param}.__esModule ? ${info.param}.default ` +
          `: (${info.param}.default !== undefined ? ${info.param}.default : ${info.param});`,
      );
    }
  }
  if (named.length > 0) {
    lines.push(`const { ${named.join(", ")} } = ${info.param};`);
  }
  return lines;
}

function emitStatement(stmt: Node, code: string, lines: string[]): void {
  switch (stmt.type) {
    case "ExportNamedDeclaration": {
      if (stmt.declaration) {
        const decl = stmt.declaration;
        lines.push(code.slice(decl.start, decl.end));
        for (const name of declaredNames(decl)) {
          lines.push(`exports.${name} = ${name};`);
        }
        return;
      }
      // export { a, b as c } [from "source"]
      if (stmt.source) {
        // Re-export from another module: pull values off its namespace.
        const ns = `_navita_reexport_${reexportCounter++}`;
        lines.push(`const ${ns} = require(${JSON.stringify(stmt.source.value)});`);
        for (const spec of stmt.specifiers || []) {
          lines.push(`exports.${spec.exported.name} = ${ns}.${spec.local.name};`);
        }
        return;
      }
      for (const spec of stmt.specifiers || []) {
        lines.push(`exports.${spec.exported.name} = ${spec.local.name};`);
      }
      return;
    }
    case "ExportDefaultDeclaration": {
      const decl = stmt.declaration;
      if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
        if (decl.id) {
          lines.push(code.slice(decl.start, decl.end));
          lines.push(`exports.default = ${decl.id.name};`);
        } else {
          lines.push(`exports.default = ${code.slice(decl.start, decl.end)};`);
        }
      } else {
        lines.push(`exports.default = ${code.slice(decl.start, decl.end)};`);
      }
      return;
    }
    case "ExportAllDeclaration": {
      const ns = `_navita_reexport_${reexportCounter++}`;
      lines.push(`const ${ns} = require(${JSON.stringify(stmt.source.value)});`);
      if (stmt.exported) {
        lines.push(`exports.${stmt.exported.name} = ${ns};`);
      } else {
        lines.push(
          `for (const _k in ${ns}) { if (_k !== "default") exports[_k] = ${ns}[_k]; }`,
        );
      }
      return;
    }
    default:
      lines.push(code.slice(stmt.start, stmt.end));
  }
}

let reexportCounter = 0;

function declaredNames(decl: Node): string[] {
  if (decl.type === "VariableDeclaration") {
    const names: string[] = [];
    for (const d of decl.declarations) {
      patternNames(d.id, names);
    }
    return names;
  }
  if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
    return decl.id ? [decl.id.name] : [];
  }
  return [];
}

const SKIP_KEYS = new Set(["type", "start", "end", "range", "loc", "parent"]);

/** Collect identifier names referenced in a subtree (skip static member/key). */
function collectIdentifierNames(node: any, out: Set<string>): void {
  if (!node || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectIdentifierNames(child, out);
    }
    return;
  }
  switch (node.type) {
    case "Identifier":
    case "IdentifierReference":
      out.add(node.name);
      return;
    case "MemberExpression":
    case "StaticMemberExpression":
    case "ComputedMemberExpression":
      if (node.computed) {
        collectIdentifierNames(node.property, out);
      }
      collectIdentifierNames(node.object, out);
      return;
    case "Property":
    case "ObjectProperty":
      if (node.computed) {
        collectIdentifierNames(node.key, out);
      }
      collectIdentifierNames(node.value, out);
      return;
    default:
      break;
  }
  for (const key in node) {
    if (SKIP_KEYS.has(key)) {
      continue;
    }
    const value = node[key];
    if (value && typeof value === "object") {
      collectIdentifierNames(value, out);
    }
  }
}
