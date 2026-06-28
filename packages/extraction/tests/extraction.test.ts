import type { ImportMap } from "@navita/types";
import { extraction } from "../src/extraction";
import { evaluate } from "./evaluate";
import { analyze } from "./helpers";

const importMap: ImportMap = [
  { callee: "style", source: "@navita/css" },
  { callee: "globalStyle", source: "@navita/css" },
];

describe("extraction — full pipeline", () => {
  it("produces a single evaluatable AMD define() expression", async () => {
    const out = await extraction(
      `import { style } from '@navita/css';\nexport const a = style({ color: 'red' });`,
      { filename: "/f.tsx", importMap },
    );
    expect(out.trimStart().startsWith("define([")).toBe(true);
    expect(out).toContain('"@navita/adapter"');
    expect(out).toContain('"@navita/css"');
    // Imports are destructured off the AMD module params.
    expect(out).toContain("collectResult");
  });

  it("strips TypeScript types", async () => {
    const out = await extraction(
      `import { style } from '@navita/css';\nconst a: string = style<{ color: string }>({ color: 'red' }) as unknown as string;`,
      { filename: "/f.tsx", importMap },
    );
    expect(out).not.toContain(": string");
    expect(out).not.toContain("as unknown");
  });

  it("respects aliased imports (style as supercool)", async () => {
    const { css, results } = await evaluate(
      `import { style as supercool } from '@navita/css';\nconst a = supercool({ color: 'red' });`,
      { importMap: [{ callee: "style", source: "@navita/css" }] },
    );
    expect(css).toBe(".a1{color:red}");
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("does not match calls of identifiers imported from other sources", async () => {
    const { results } = await evaluate(
      `import { style } from 'some-other-lib';\nconst a = style({ color: 'red' });`,
      {
        importMap: [{ callee: "style", source: "@navita/css" }],
        extraModules: { "some-other-lib": { style: () => "noop" } },
      },
    );
    expect(results.filter(Boolean)).toHaveLength(0);
  });

  it("does not match member-expression callees (obj.style(...))", async () => {
    const out = await extraction(
      `import { style } from '@navita/css';\nconst obj = { style };\nconst a = obj.style({ color: 'red' });`,
      { filename: "/f.tsx", importMap },
    );
    expect(out).not.toContain("collectResult");
  });

  it("keeps and interops default imports referenced inside style args", async () => {
    const { css } = await evaluate(
      `import { style } from '@navita/css';\nimport prefix from 'prefixer';\nconst a = style({ color: prefix('red') });`,
      {
        importMap: [{ callee: "style", source: "@navita/css" }],
        extraModules: { prefixer: { default: (v: string) => v } },
      },
    );
    expect(css).toBe(".a1{color:red}");
  });

  it("prunes unused imports (entry points)", async () => {
    const out = await extraction(
      `import { style } from '@navita/css';\nimport { somethingUnused } from 'unresolvable-module';\nconst a = style({ color: 'red' });`,
      { filename: "/f.tsx", importMap },
    );
    // The unused import (which would otherwise fail to resolve) is dropped.
    expect(out).not.toContain("unresolvable-module");
    expect(out).not.toContain("somethingUnused");
  });

  it("returns valid output when there are no style calls", async () => {
    const out = await extraction(
      `import { style } from '@navita/css';\nconsole.log('hi');`,
      {
        filename: "/f.tsx",
        importMap,
      },
    );
    expect(out.trimStart().startsWith("define([")).toBe(true);
    const { collectResults } = analyze(`import { x } from "y";`); // smoke for analyze on simple input
    expect(collectResults).toEqual([]);
  });
});
