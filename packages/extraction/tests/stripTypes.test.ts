import { stripTypes } from "../src/stripTypes";

describe("stripTypes", () => {
  it("erases type annotations but keeps the value", () => {
    const out = stripTypes("t.ts", `const a: string = 'x';\nexport { a };`);
    expect(out).not.toContain(": string");
    expect(out).toContain(`const a = "x"`);
    // Module syntax is preserved (not down-leveled to CJS).
    expect(out).toContain("export { a }");
  });

  it("removes `as` type assertions", () => {
    const out = stripTypes("t.ts", `const a = (1 as unknown) as string;`);
    expect(out).not.toContain("as unknown");
    expect(out).not.toContain("as string");
    expect(out).toContain("const a = 1");
  });

  it("drops interface declarations entirely", () => {
    const out = stripTypes(
      "t.ts",
      `interface I { a: number }\nexport const b: I = { a: 1 };`,
    );
    expect(out).not.toContain("interface");
    expect(out).toContain("export const b = { a: 1 }");
  });

  it("drops type aliases entirely", () => {
    const out = stripTypes("t.ts", `type T = number;\nexport const c = 1;`);
    expect(out).not.toContain("type T");
    expect(out).toContain("export const c = 1");
  });

  it("drops `import type` but keeps value imports", () => {
    const out = stripTypes(
      "t.ts",
      `import type { T } from 'y';\nimport { z } from 'y';\nexport const a: T = z;`,
    );
    expect(out).not.toContain("import type");
    expect(out).toContain(`import { z } from "y"`);
    expect(out).toContain("export const a = z");
  });

  it("transforms JSX (uses the automatic runtime, drops raw markup)", () => {
    const out = stripTypes(
      "t.tsx",
      `export const el = <div className="a">hi</div>;`,
    );
    expect(out).not.toContain("<div");
    expect(out).toContain("react/jsx-runtime");
    expect(out).toContain('"div"');
  });

  it("preserves modern syntax (no down-leveling of import/export)", () => {
    const out = stripTypes(
      "t.ts",
      `import { x } from 'y';\nexport const a = x;`,
    );
    expect(out).toContain("import { x }");
    expect(out).toContain("export const a = x");
    expect(out).not.toContain("require(");
  });
});
