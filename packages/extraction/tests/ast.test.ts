import {
  collectArgumentIdents,
  createLineColumnLookup,
  getCalleeName,
  getInitCalleeName,
  importedName,
  type Node,
  patternNames,
  unwrapParens,
  walk,
} from "../src/ast";
import { getParser } from "../src/loadOxc";

/** Parse `code` and return the program body. */
function parse(code: string, lang: "js" | "tsx" = "tsx"): Node[] {
  const { program } = getParser().parseSync("t.tsx", code, {
    lang,
    sourceType: "module",
  });
  return program.body;
}

/**
 * Parse a single expression statement and return the expression node. Pass an
 * object literal already wrapped in parens (`({ ... })`) to avoid block-stmt
 * ambiguity — oxc preserves parens, so the result is a ParenthesizedExpression.
 */
function parseExpr(code: string): Node {
  const body = parse(`${code};`);
  return (body[0] as Node).expression;
}

describe("ast — patternNames", () => {
  const declId = (code: string): Node =>
    (parse(code)[0] as Node).declarations[0].id;

  it("collects a plain identifier binding", () => {
    expect(patternNames(declId(`const a = 1;`))).toEqual(["a"]);
  });

  it("collects array pattern bindings (and skips holes)", () => {
    expect(patternNames(declId(`const [a, , b] = xs;`))).toEqual(["a", "b"]);
  });

  it("collects object pattern bindings from values, including rest", () => {
    expect(patternNames(declId(`const { a, b: c, ...d } = o;`))).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  it("collects from assignment patterns (defaults)", () => {
    expect(patternNames(declId(`const [a = 1, { b = 2 }] = xs;`))).toEqual([
      "a",
      "b",
    ]);
  });

  it("handles nested array/object/rest patterns", () => {
    expect(patternNames(declId(`const [{ a }, [b, ...c]] = xs;`))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("returns the provided accumulator and is a no-op for null", () => {
    const acc: string[] = ["existing"];
    expect(patternNames(null, acc)).toBe(acc);
    expect(acc).toEqual(["existing"]);
    expect(patternNames(undefined)).toEqual([]);
  });
});

describe("ast — collectArgumentIdents", () => {
  const idents = (code: string): string[] => {
    const out = new Set<string>();
    collectArgumentIdents(parseExpr(code), out);
    return [...out].sort();
  };

  it("collects a bare identifier", () => {
    expect(idents(`foo`)).toEqual(["foo"]);
  });

  it("collects the object of a static member but not the property", () => {
    expect(idents(`a.b.c`)).toEqual(["a"]);
  });

  it("collects the computed property of a member expression", () => {
    expect(idents(`a[b]`)).toEqual(["a", "b"]);
  });

  it("collects object property values but not (static) keys", () => {
    expect(idents(`({ key: value, other: thing })`)).toEqual([
      "thing",
      "value",
    ]);
  });

  it("collects computed object property keys", () => {
    expect(idents(`({ [dynamic]: value })`)).toEqual(["dynamic", "value"]);
  });

  it("descends through call arguments", () => {
    expect(idents(`fn(a, b.c, d[e])`)).toEqual(["a", "b", "d", "e", "fn"]);
  });

  it("skips TypeScript type positions (as / satisfies / non-null)", () => {
    // `Color` is only a type — it must not be collected as a value ident.
    expect(idents(`value as Color`)).toEqual(["value"]);
    expect(idents(`value satisfies Color`)).toEqual(["value"]);
    expect(idents(`value!`)).toEqual(["value"]);
  });

  it("ignores non-object inputs", () => {
    const out = new Set<string>();
    collectArgumentIdents(null, out);
    collectArgumentIdents("string" as unknown as Node, out);
    collectArgumentIdents(42 as unknown as Node, out);
    expect(out.size).toBe(0);
  });
});

describe("ast — unwrapParens", () => {
  it("unwraps a single layer of parentheses", () => {
    const node = parseExpr(`(x)`);
    expect(unwrapParens(node).type).toBe("Identifier");
    expect(unwrapParens(node).name).toBe("x");
  });

  it("unwraps nested parentheses down to the inner expression", () => {
    const stmt = parse(`const v = (((y)));`)[0] as Node;
    const init = stmt.declarations[0].init;
    const inner = unwrapParens(init);
    expect(inner.type).toBe("Identifier");
    expect(inner.name).toBe("y");
  });

  it("returns the node unchanged when there are no parens", () => {
    const node = parseExpr(`z`);
    expect(unwrapParens(node)).toBe(node);
  });

  it("returns null for null/undefined", () => {
    expect(unwrapParens(null)).toBeNull();
    expect(unwrapParens(undefined)).toBeNull();
  });
});

describe("ast — getCalleeName / getInitCalleeName", () => {
  it("returns the identifier callee of a call expression", () => {
    expect(getCalleeName(parseExpr(`style({})`))).toBe("style");
  });

  it("returns null for member-expression callees", () => {
    expect(getCalleeName(parseExpr(`obj.style({})`))).toBeNull();
  });

  it("unwraps parenthesized callees", () => {
    expect(getCalleeName(parseExpr(`(style)({})`))).toBe("style");
  });

  it("getInitCalleeName reads through parens to the call", () => {
    const init = (parse(`const a = (style({}));`)[0] as Node).declarations[0]
      .init;
    expect(getInitCalleeName(init)).toBe("style");
  });

  it("getInitCalleeName returns null when the init is not a call", () => {
    const init = (parse(`const a = 1;`)[0] as Node).declarations[0].init;
    expect(getInitCalleeName(init)).toBeNull();
    expect(getInitCalleeName(null)).toBeNull();
  });
});

describe("ast — importedName", () => {
  const specOf = (code: string): Node => (parse(code)[0] as Node).specifiers[0];

  it("uses the imported name for a renamed named import", () => {
    expect(importedName(specOf(`import { a as b } from "x";`))).toBe("a");
  });

  it("uses the local name when imported and local match", () => {
    expect(importedName(specOf(`import { a } from "x";`))).toBe("a");
  });

  it("reads string-literal imported names", () => {
    expect(importedName(specOf(`import { "a-b" as c } from "x";`))).toBe("a-b");
  });
});

describe("ast — createLineColumnLookup", () => {
  it("maps offsets to 1-based line / 0-based column", () => {
    const code = "ab\ncde\nf";
    const at = createLineColumnLookup(code);
    expect(at(0)).toEqual({ line: 1, column: 0 });
    expect(at(1)).toEqual({ line: 1, column: 1 });
    // offset 3 is 'c', the first char on line 2.
    expect(at(3)).toEqual({ line: 2, column: 0 });
    expect(at(5)).toEqual({ line: 2, column: 2 });
    // offset 7 is 'f', the first char on line 3.
    expect(at(7)).toEqual({ line: 3, column: 0 });
  });

  it("treats the start of the file as line 1 column 0", () => {
    expect(createLineColumnLookup("")(0)).toEqual({ line: 1, column: 0 });
  });

  it("places offsets sitting on the newline at the end of the prior line", () => {
    const code = "ab\ncd";
    const at = createLineColumnLookup(code);
    // offset 2 is the '\n' itself — still line 1.
    expect(at(2)).toEqual({ line: 1, column: 2 });
  });
});

describe("ast — walk", () => {
  it("visits every typed node", () => {
    const types: string[] = [];
    walk(parse(`const a = style({ color: 'red' });`), (n) => {
      types.push(n.type);
    });
    expect(types).toContain("VariableDeclaration");
    expect(types).toContain("CallExpression");
    expect(types).toContain("Identifier");
  });

  it("stops descending when the visitor returns false", () => {
    const callees: string[] = [];
    walk(parse(`const a = outer(inner(deep));`), (n) => {
      if (n.type === "CallExpression") {
        callees.push(getCalleeName(n) ?? "?");
        return false; // do not descend into nested calls
      }
    });
    // Only the outer call is recorded; descent into `inner(...)` is skipped.
    expect(callees).toEqual(["outer"]);
  });

  it("ignores primitives and null", () => {
    expect(() => walk(null, () => {})).not.toThrow();
    expect(() => walk(42, () => {})).not.toThrow();
  });
});
