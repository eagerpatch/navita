import { sortAtRules } from "../../../src/printers/sortAtRules";
import type { StyleBlock } from "../../../src/types";

describe("sortAtRules", () => {
  const createBlock = (data: Partial<StyleBlock> = {}) => {
    return {
      id: "",
      type: "rule",
      selector: "",
      declaration: "some:declaration",
      property: "",
      value: "",
      pseudo: "",
      media: "",
      support: "",
      container: "",
      ...data,
    } as const;
  };

  it("should sort rules", () => {
    const blocks: StyleBlock[] = [
      createBlock({ id: "a", media: "(min-width: 200px)" }),
      createBlock({ id: "b", media: "(min-width: 300px)" }),
      createBlock({ id: "c", media: "(min-width: 100px)", support: "y" }),
      createBlock({ id: "d", media: "(min-width: 100px)", support: "x" }),
      createBlock({ id: "e", media: "", support: "", container: "x" }),
      createBlock({
        id: "f",
        media: "(min-width: 400px)",
        container: "(min-width: 400px)",
      }),
      createBlock({
        id: "g",
        media: "(min-width: 500px)",
        container: "(min-width: 500px)",
        support: "x",
      }),
    ];

    expect(sortAtRules(blocks).map((x) => x.id)).toEqual([
      "d",
      "c",
      "a",
      "b",
      "f",
      "g",
      "e",
    ]);
  });

  it("sorts media queries from smallest to largest (mobile-first)", () => {
    const blocks: StyleBlock[] = [
      createBlock({ id: "m3", media: "(min-width: 300px)" }),
      createBlock({ id: "m1", media: "(min-width: 100px)" }),
      createBlock({ id: "m2", media: "(min-width: 200px)" }),
    ];

    expect(sortAtRules(blocks).map((x) => x.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("falls back to container ordering when media is equal", () => {
    const blocks: StyleBlock[] = [
      createBlock({
        id: "c2",
        media: "(min-width: 100px)",
        container: "(min-width: 300px)",
      }),
      createBlock({
        id: "c1",
        media: "(min-width: 100px)",
        container: "(min-width: 200px)",
      }),
    ];

    expect(sortAtRules(blocks).map((x) => x.id)).toEqual(["c1", "c2"]);
  });

  it("falls back to support ordering (alphabetical) when media and container are equal", () => {
    const blocks: StyleBlock[] = [
      createBlock({
        id: "sB",
        media: "(min-width: 100px)",
        support: "(display: grid)",
      }),
      createBlock({
        id: "sA",
        media: "(min-width: 100px)",
        support: "(display: flex)",
      }),
    ];

    expect(sortAtRules(blocks).map((x) => x.id)).toEqual(["sA", "sB"]);
  });
});
