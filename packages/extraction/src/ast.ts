/**
 * Shared AST helpers for the extraction transform.
 *
 * We operate on the ESTree-compatible AST produced by `oxc-parser`. Node spans
 * (`.start` / `.end`) are UTF-16 code-unit offsets, i.e. plain JavaScript string
 * indices, so `code.slice(node.start, node.end)` returns the node's source text.
 */

// Minimal structural typing — the oxc AST is plain JSON-ish objects. We declare
// the fields we navigate (so accesses stay typed) and fall back to `unknown` for
// everything else via the index signature.
export interface Node {
  type?: string;
  name?: string;
  start?: number;
  end?: number;
  computed?: boolean;
  importKind?: string;
  value?: unknown;
  callee?: Node;
  object?: Node;
  property?: Node;
  key?: Node;
  expression?: Node;
  init?: Node;
  id?: Node;
  left?: Node;
  argument?: Node;
  declaration?: Node;
  source?: Node;
  exported?: Node;
  imported?: Node;
  local?: Node;
  body?: Node[];
  declarations?: Node[];
  specifiers?: Node[];
  properties?: Node[];
  arguments?: Node[];
  elements?: Array<Node | null>;
  [key: string]: unknown;
}

const SKIP_KEYS = new Set(["type", "start", "end", "range", "loc", "parent"]);

/**
 * Recursively visit every child node. The callback may return `false` to skip
 * descending into that node's children.
 */
export function walk(
  node: unknown,
  visit: (node: Node) => void | boolean,
): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, visit);
    }
    return;
  }

  const n = node as Node;

  if (typeof n.type === "string") {
    const descend = visit(n);
    if (descend === false) {
      return;
    }
  }

  for (const key in n) {
    if (SKIP_KEYS.has(key)) {
      continue;
    }
    const value = n[key];
    if (value && typeof value === "object") {
      walk(value, visit);
    }
  }
}

/** Unwrap `(expr)` parenthesized expressions. */
export function unwrapParens(node: Node | null | undefined): Node | null {
  let current: Node | null | undefined = node;
  while (current && current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current ?? null;
}

/**
 * Return the callee identifier name of a call expression, if the callee is a
 * plain identifier (mirrors the Rust `get_callee_ident`). Member expressions
 * (`obj.style(...)`) return `null`.
 */
export function getCalleeName(callExpr: Node): string | null {
  const callee = unwrapParens(callExpr.callee);
  if (callee && callee.type === "Identifier") {
    return callee.name as string;
  }
  return null;
}

/**
 * If `expr` (after unwrapping parens) is a call expression whose callee is a
 * plain identifier, return that identifier name (mirrors `get_callee_ident` on
 * an init expression).
 */
export function getInitCalleeName(
  expr: Node | null | undefined,
): string | null {
  const inner = unwrapParens(expr);
  if (inner && inner.type === "CallExpression") {
    return getCalleeName(inner);
  }
  return null;
}

/**
 * Collect the binding identifier names introduced by a binding pattern.
 * Mirrors `collect_ids_from_pat`.
 */
export function patternNames(
  pat: Node | null | undefined,
  out: string[] = [],
): string[] {
  if (!pat) {
    return out;
  }

  switch (pat.type) {
    case "Identifier":
    case "BindingIdentifier":
      out.push(pat.name as string);
      break;
    case "AssignmentPattern":
      patternNames(pat.left, out);
      break;
    case "ArrayPattern":
      for (const element of pat.elements || []) {
        if (element) {
          patternNames(element, out);
        }
      }
      break;
    case "ObjectPattern":
      for (const prop of pat.properties || []) {
        if (prop.type === "RestElement") {
          patternNames(prop.argument, out);
        } else {
          // Property: the binding lives in `.value`.
          patternNames(prop.value as Node, out);
        }
      }
      break;
    case "RestElement":
      patternNames(pat.argument, out);
      break;
    default:
      break;
  }

  return out;
}

/**
 * Collect identifier names referenced inside a value expression, applying the
 * same skipping rules as the Rust `IdentCollector`:
 *  - For member expressions, only descend into a computed property; never the
 *    static property name (`a.b` collects `a`, not `b`).
 *  - For object properties, only descend into a computed key; always the value
 *    (`{ key: value }` collects `value`, not `key`).
 *  - TypeScript type positions are skipped.
 */
export function collectArgumentIdents(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      collectArgumentIdents(child, out);
    }
    return;
  }

  const n = node as Node;

  switch (n.type) {
    case "Identifier":
    case "IdentifierReference":
      out.add(n.name as string);
      return;
    case "MemberExpression":
    case "StaticMemberExpression":
    case "ComputedMemberExpression": {
      if (n.computed) {
        collectArgumentIdents(n.property, out);
      }
      collectArgumentIdents(n.object, out);
      return;
    }
    case "Property":
    case "ObjectProperty": {
      if (n.computed) {
        collectArgumentIdents(n.key, out);
      }
      collectArgumentIdents(n.value, out);
      return;
    }
    // Skip TypeScript type positions, descend only into the value expression.
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TSInstantiationExpression":
    case "TSTypeAssertion":
      collectArgumentIdents(n.expression, out);
      return;
    default:
      break;
  }

  for (const key in n) {
    if (SKIP_KEYS.has(key)) {
      continue;
    }
    const value = n[key];
    if (value && typeof value === "object") {
      collectArgumentIdents(value, out);
    }
  }
}

/** Build a (1-based line, 0-based column) lookup for byte/UTF-16 offsets. */
export function createLineColumnLookup(
  code: string,
): (offset: number) => { line: number; column: number } {
  const lineStarts = [0];
  for (let i = 0; i < code.length; i++) {
    if (code.charCodeAt(i) === 10 /* \n */) {
      lineStarts.push(i + 1);
    }
  }

  return (offset: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return { line: lo + 1, column: offset - lineStarts[lo] };
  };
}

/** The imported name of a named import specifier (identifier or string key). */
export function importedName(spec: Node): string {
  const imported = spec.imported;
  if (!imported) {
    return spec.local.name as string;
  }
  return imported.type === "Identifier" || imported.type === "ImportSpecifier"
    ? (imported.name as string)
    : (imported.value as string);
}
