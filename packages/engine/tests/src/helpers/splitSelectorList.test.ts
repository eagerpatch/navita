import { splitSelectorList } from "../../../src/helpers/splitSelectorList";

describe("splitSelectorList", () => {
  it("splits a plain comma-separated list", () => {
    expect(splitSelectorList("::after, ::before")).toEqual([
      "::after",
      "::before",
    ]);
  });

  it("trims whitespace and drops empty segments", () => {
    expect(splitSelectorList("  &:hover ,  &:focus  ,")).toEqual([
      "&:hover",
      "&:focus",
    ]);
  });

  it("does not split commas inside parentheses (:is/:not)", () => {
    expect(splitSelectorList("&:is(.a, .b)")).toEqual(["&:is(.a, .b)"]);
    expect(splitSelectorList("&:not(.x, .y)")).toEqual(["&:not(.x, .y)"]);
  });

  it("handles nested parentheses", () => {
    expect(splitSelectorList("&:is(:not(.a, .b), .c), .d")).toEqual([
      "&:is(:not(.a, .b), .c)",
      ".d",
    ]);
  });

  it("does not split commas inside attribute selectors", () => {
    expect(splitSelectorList('[data-x=","]')).toEqual(['[data-x=","]']);
    expect(splitSelectorList('[data-x=","], [data-y]')).toEqual([
      '[data-x=","]',
      "[data-y]",
    ]);
  });

  it("does not split commas inside quoted strings", () => {
    expect(splitSelectorList('[title="a, b"], .next')).toEqual([
      '[title="a, b"]',
      ".next",
    ]);
    expect(splitSelectorList("[title='a, b']")).toEqual(["[title='a, b']"]);
  });

  it("returns the single selector when there is no top-level comma", () => {
    expect(splitSelectorList("&:hover")).toEqual(["&:hover"]);
  });
});
