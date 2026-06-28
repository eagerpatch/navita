import { evaluate } from "./evaluate";

describe("extraction — end to end evaluation", () => {
  it("collects a single style rule", async () => {
    const { css, results } = await evaluate(`
      import { style } from '@navita/css';
      const a = style({ color: 'red' });
    `);
    expect(css).toBe(".a1{color:red}");
    expect(results).toEqual([{ start: 60, end: 83, value: '"a1"' }]);
  });

  it("collects two style rules in order", async () => {
    const { css, results } = await evaluate(`
      import { style } from '@navita/css';
      const a = style({ color: 'red' });
      const b = style({ color: 'blue' });
    `);
    expect(css).toBe(".a1{color:red}.a2{color:blue}");
    expect(results.map((r) => r.value)).toEqual(['"a1"', '"a2"']);
  });

  it("collects a global style rule", async () => {
    const { css } = await evaluate(`
      import { globalStyle } from '@navita/css';
      globalStyle('body', { color: 'purple' });
    `);
    expect(css).toBe("body{color:purple;}");
  });

  it("preserves dependency identifiers used inside style args", async () => {
    const { css } = await evaluate(`
      import { style } from '@navita/css';
      const shared = 'green';
      const a = style({ color: shared });
    `);
    expect(css).toBe(".a1{color:green}");
  });

  it("hoists nested style declarations out of functions/arrows", async () => {
    const { css, results } = await evaluate(`
      import { globalStyle, style as supercool } from "@navita/css";
      const preserved = 'hotpink';

      globalStyle('body', { color: preserved });

      function hoisted(argName) {
        const wow = supercool({ color: 'blue' });
      }

      const also = () => {
        const hoistedAgain = supercool({ background: 'red' });
      }

      export const unused = true;
    `);
    // Three style calls are collected (globalStyle + two hoisted supercool).
    expect(results.filter(Boolean)).toHaveLength(3);
    expect(css).toContain("body{color:hotpink;}");
    expect(css).toContain("color:blue");
    expect(css).toContain("background:red");
  });

  it("entryPoint:false passes through (no collectResult) but stays evaluatable", async () => {
    const { output, exports } = await evaluate(
      `
      export const background = 'red';
      export const spacing = 8;
    `,
      { entryPoint: false },
    );
    expect(output).not.toContain("collectResult");
    expect(exports).toEqual({ background: "red", spacing: 8 });
  });

  it("entryPoint:false runs style calls directly and exports their result", async () => {
    // Passthrough does not wrap calls in collectResult, so styles are computed
    // (and exported) but not marked "used" for rendering — same as the old path.
    const { output, exports } = await evaluate(
      `
      import { style } from '@navita/css';
      export const card = style({ color: 'red' });
    `,
      { entryPoint: false },
    );
    expect(output).not.toContain("collectResult");
    expect(String(exports.card)).toBe("a1");
  });
});
