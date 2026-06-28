import { getParser } from "../src/loadOxc";

export type CollectResultMeta = {
  filePath: string;
  index: number;
  identifier: string;
  position: [number, number];
  sourceMap: { line: number; column: number };
  resultCallee: string | null;
};

export type Analysis = {
  imports: { source: string; specifiers: string[] }[];
  lets: string[];
  collectResults: CollectResultMeta[];
  topLevelKinds: string[];
};

function literalValue(node: any): any {
  if (!node) return undefined;
  if (node.type === "Literal") return node.value;
  if (node.type === "UnaryExpression" && node.operator === "-") {
    return -literalValue(node.argument);
  }
  return undefined;
}

function readObject(obj: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const prop of obj.properties || []) {
    if (prop.type !== "Property") continue;
    const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.value;
    out[key] = prop.value;
  }
  return out;
}

function calleeName(node: any): string | null {
  const callee = node && node.callee;
  if (callee && callee.type === "Identifier") return callee.name;
  if (
    callee &&
    callee.type === "MemberExpression" &&
    callee.property?.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

/** Parse an extraction-rewrite output and extract structural facts. */
export function analyze(code: string): Analysis {
  const { program } = getParser().parseSync("out.tsx", code, {
    lang: "tsx",
    sourceType: "module",
  });
  const body: any[] = program.body;

  const imports: { source: string; specifiers: string[] }[] = [];
  const lets: string[] = [];
  const topLevelKinds: string[] = [];

  for (const stmt of body) {
    topLevelKinds.push(stmt.type);
    if (stmt.type === "ImportDeclaration") {
      imports.push({
        source: stmt.source.value,
        specifiers: (stmt.specifiers || []).map((s: any) => s.local.name),
      });
    }
    if (
      stmt.type === "VariableDeclaration" &&
      stmt.kind === "let" &&
      stmt.declarations.every((d: any) => d.init === null)
    ) {
      for (const d of stmt.declarations) {
        if (d.id.type === "Identifier") lets.push(d.id.name);
      }
    }
  }

  // Collect collectResult(...) calls in source order.
  const collectResults: CollectResultMeta[] = [];
  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (
      node.type === "CallExpression" &&
      calleeName(node) === "collectResult"
    ) {
      const arg = node.arguments[0];
      const o = readObject(arg);
      const pos = (o.position?.elements || []).map(literalValue);
      const sm = readObject(o.sourceMap || { properties: [] });
      const thunk = o.result;
      let resultCallee: string | null = null;
      if (
        thunk &&
        (thunk.type === "ArrowFunctionExpression" ||
          thunk.type === "FunctionExpression")
      ) {
        const b = thunk.body;
        const expr = b.type === "BlockStatement" ? null : b;
        if (expr && expr.type === "CallExpression")
          resultCallee = calleeName(expr);
      }
      collectResults.push({
        filePath: literalValue(o.filePath),
        index: literalValue(o.index),
        identifier: literalValue(o.identifier),
        position: [pos[0], pos[1]],
        sourceMap: {
          line: literalValue(sm.line),
          column: literalValue(sm.column),
        },
        resultCallee,
      });
      // do not descend into the matched call's thunk for nested collectResults
      return;
    }
    for (const key in node) {
      if (key === "type" || key === "start" || key === "end") continue;
      const value = node[key];
      if (value && typeof value === "object") visit(value);
    }
  };
  visit(program);

  return { imports, lets, collectResults, topLevelKinds };
}
