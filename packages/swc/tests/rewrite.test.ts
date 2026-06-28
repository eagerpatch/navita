import type { ImportMap } from "@navita/types";
import { rewrite } from "../src/rewrite";
import { analyze } from "./helpers";

const importMap: ImportMap = [
  { callee: "style", source: "@navita/css" },
  { callee: "globalStyle", source: "@navita/css" },
  { callee: "createTheme", source: "@navita/css" },
];

const filename = "super-cool-filename";
const run = (code: string) => rewrite(code, { filename, importMap });

// Inputs copied verbatim from crates/extraction/src/lib.rs `test!(...)` fixtures
// so byte positions line up with the expected values asserted below.

describe("rewrite — ported lib.rs fixtures", () => {
  it("handles_export_var_decl", () => {
    const out = run(`
      import { style } from "@navita/css";

      export const unused = true;
      export const tests = style({ color: 'red' });
      const something = style({ color: 'green' });
    `);

    const { imports, lets, collectResults } = analyze(out);

    expect(imports).toEqual([
      { source: "@navita/adapter", specifiers: ["collectResult"] },
      { source: "@navita/css", specifiers: ["style"] },
    ]);
    expect(lets).toEqual([]);
    expect(collectResults).toEqual([
      {
        filePath: filename,
        index: 0,
        identifier: "tests",
        position: [106, 129],
        sourceMap: { line: 5, column: 27 },
        resultCallee: "style",
      },
      {
        filePath: filename,
        index: 1,
        identifier: "something",
        position: [155, 180],
        sourceMap: { line: 6, column: 24 },
        resultCallee: "style",
      },
    ]);
    // The unused export is pruned.
    expect(out).not.toContain("unused");
  });

  it("preserves_imports_when_none_found", () => {
    const out = run(`
      import { style } from "@navita/css";
      import { someImport } from "some-other-place";

      console.log(someImport);
    `);

    const { imports, collectResults } = analyze(out);
    expect(collectResults).toEqual([]);
    expect(imports).toEqual([
      { source: "@navita/adapter", specifiers: ["collectResult"] },
      { source: "@navita/css", specifiers: ["style"] },
      { source: "some-other-place", specifiers: ["someImport"] },
    ]);
    // The non-style statement is pruned.
    expect(out).not.toContain("console.log");
  });

  it("works_with_call_expressions", () => {
    const out = run(`
      import { globalStyle } from "@navita/css";

      globalStyle('body', {
        fontSize: '50px',
      });
    `);

    const { collectResults } = analyze(out);
    expect(collectResults).toEqual([
      {
        filePath: filename,
        index: 0,
        identifier: "",
        position: [57, 113],
        sourceMap: { line: 4, column: 6 },
        resultCallee: "globalStyle",
      },
    ]);
  });

  it("works_with_both", () => {
    const out = run(`
      import { globalStyle, style } from "@navita/css";

      globalStyle('body', {
        color: 'purple',
      });

      const yellow = style({
        background: 'yellow',
      });
    `);

    const { collectResults } = analyze(out);
    expect(collectResults).toEqual([
      {
        filePath: filename,
        index: 0,
        identifier: "",
        position: [64, 119],
        sourceMap: { line: 4, column: 6 },
        resultCallee: "globalStyle",
      },
      {
        filePath: filename,
        index: 1,
        identifier: "yellow",
        position: [143, 189],
        sourceMap: { line: 8, column: 21 },
        resultCallee: "style",
      },
    ]);
  });

  it("works_with_nested_hoisting", () => {
    const out = run(`
      import { globalStyle, createTheme, style as supercool } from "@navita/css";
      const preserved = 'hello';
      export const [vars] = createTheme({
       color: {
         red: 'purple',
         value: preserved,
         more: {
           stuff: 'heje',
         }
       },
      });

      const [hej, hejsan, tja] = [1, 2, 3];

      globalStyle('body', {
        color: vars.color.red,
        hej,
        hejsan,
        tja,
      });

      function hoisted(argName) {
        const wow = supercool({ color: 'blue', background: argName });
      }

      const also = () => {
        const hoistedAgain = supercool({ color: 'blue', background: 'red' });
      }
    `);

    const { imports, lets, collectResults } = analyze(out);

    expect(imports).toEqual([
      { source: "@navita/adapter", specifiers: ["collectResult"] },
      { source: "@navita/css", specifiers: ["globalStyle", "createTheme", "supercool"] },
    ]);
    expect(lets).toEqual(["argName"]);
    expect(collectResults).toEqual([
      {
        filePath: filename,
        index: 0,
        identifier: "vars",
        position: [144, 297],
        sourceMap: { line: 4, column: 28 },
        resultCallee: "createTheme",
      },
      {
        filePath: filename,
        index: 1,
        identifier: "",
        position: [351, 454],
        sourceMap: { line: 16, column: 6 },
        resultCallee: "globalStyle",
      },
      {
        filePath: filename,
        index: 2,
        identifier: "wow",
        position: [511, 560],
        sourceMap: { line: 24, column: 20 },
        resultCallee: "supercool",
      },
      {
        filePath: filename,
        index: 3,
        identifier: "hoistedAgain",
        position: [627, 674],
        sourceMap: { line: 28, column: 29 },
        resultCallee: "supercool",
      },
    ]);

    // Hoisted-out declarations are preserved; their wrappers are dropped.
    expect(out).toContain("const preserved = 'hello';");
    expect(out).toContain("const wow = collectResult(");
    expect(out).toContain("const hoistedAgain = collectResult(");
    expect(out).not.toContain("function hoisted");
    expect(out).not.toContain("const also");
  });
});
