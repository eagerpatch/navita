import { Engine } from "../../../src";
import { printStyleBlocks } from "../../../src/printers/printStyleBlocks";
import { sortAtRules } from "../../../src/printers/sortAtRules";

describe("printStyleBlock", () => {
  it("should handle nesting correctly", () => {
    const renderer = new Engine();
    renderer.addStyle({
      "@media (min-width: 100px)": {
        color: "green",
      },
    });
    renderer.addStyle({
      "@supports (display: grid)": {
        color: "yellow",
      },
    });
    renderer.addStyle({
      "@media (min-width: 100px)": {
        "@supports (display: grid)": {
          color: "purple",
        },
        "@media (max-width: 300px)": {
          color: "green",
        },
      },
    });

    // printStyleBlock assumes a sorted array of blocks.
    const blocks = sortAtRules(renderer.caches.rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px){.a1{color:green}@supports (display: grid){.c1{color:purple}}}@media (min-width: 100px) and (max-width: 300px){.d1{color:green}}@supports (display: grid){.b1{color:yellow}}"`,
    );
  });

  it("should concat media queries", () => {
    const renderer = new Engine();
    renderer.addStyle({
      "@media (min-width: 100px)": {
        "@media (max-width: 300px)": {
          color: "green",
        },
      },
    });

    // printStyleBlock assumes a sorted array of blocks.
    const blocks = sortAtRules(renderer.caches.rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px) and (max-width: 300px){.a1{color:green}}"`,
    );
  });

  it("should be able to go from static without media query to static with media query", () => {
    const renderer = new Engine();

    renderer.addStatic(":root", {
      color: "red",
    });

    renderer.addStatic(":root", {
      "@media (min-width: 100px)": {
        color: "green",
      },
    });

    // Static rules are not sorted
    const blocks = renderer.caches.static.items();
    const result = printStyleBlocks(blocks);
    expect(result).toMatchInlineSnapshot(
      `":root{color:red;}@media (min-width: 100px){:root{color:green;}}"`,
    );
  });

  it("should be able to render static rules with pseudos", () => {
    const renderer = new Engine();
    renderer.addStatic(":root", {
      color: "green",
      backgroundColor: "red",
      ":hover": {
        color: "red",
      },
      "::before": {
        color: "blue",
      },
      "::after": {
        color: "black",
      },
    });
    renderer.addStatic(".something", {
      color: "green",
    });

    const blocks = renderer.caches.static.items();
    const result = printStyleBlocks(blocks);
    expect(result).toMatchInlineSnapshot(
      `":root{color:green;background-color:red;}:root:hover{color:red;}:root::before{color:blue;}:root::after{color:black;}.something{color:green;}"`,
    );
  });

  it("should handle long-hand and short-hand properties", () => {
    const renderer = new Engine();
    renderer.addStyle({
      margin: "10px",
    });
    renderer.addStyle({
      marginTop: "10px",
    });
    const blocks = renderer.caches.rule.items();
    const result = printStyleBlocks(blocks);
    expect(result).toMatchInlineSnapshot(
      `".a1{margin:10px}.b1.b1{margin-top:10px}"`,
    );
  });

  it("should handle container queries", () => {
    const renderer = new Engine();

    renderer.addStyle({
      "@container (min-width: 100px)": {
        background: "green",
      },
    });

    renderer.addStyle({
      "@container named (min-width: 100px)": {
        color: "green",
        "@container (min-width: 200px)": {
          color: "red",
        },
      },
    });

    // printStyleBlock assumes a sorted array of blocks.
    const blocks = sortAtRules(renderer.caches.rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@container (min-width: 100px){.a1{background:green}}@container named (min-width: 100px){.b1{color:green}}@container named (min-width: 100px) and (min-width: 200px){.c1{color:red}}"`,
    );
  });

  it("reopens a repeated inner at-rule when the outer at-rule changes (C6)", () => {
    const renderer = new Engine();

    // Two blocks that share the same @supports but live under different @media.
    // The inner @supports must be reopened under the second @media instead of
    // the second @media being (incorrectly) nested inside the first.
    renderer.addStyle({
      "@media (min-width: 100px)": {
        "@supports (display: grid)": {
          color: "red",
        },
      },
    });
    renderer.addStyle({
      "@media (min-width: 200px)": {
        "@supports (display: grid)": {
          color: "blue",
        },
      },
    });

    const blocks = sortAtRules(renderer.caches.rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px){@supports (display: grid){.a1{color:red}}}@media (min-width: 200px){@supports (display: grid){.b1{color:blue}}}"`,
    );
  });

  it("reopens repeated inner at-rules across three levels when the outer changes (C6)", () => {
    const renderer = new Engine();

    renderer.addStyle({
      "@media (min-width: 100px)": {
        "@container (min-width: 50px)": {
          "@supports (display: grid)": {
            color: "red",
          },
        },
      },
    });
    renderer.addStyle({
      "@media (min-width: 200px)": {
        "@container (min-width: 50px)": {
          "@supports (display: grid)": {
            color: "blue",
          },
        },
      },
    });

    const blocks = sortAtRules(renderer.caches.rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px){@container (min-width: 50px){@supports (display: grid){.a1{color:red}}}}@media (min-width: 200px){@container (min-width: 50px){@supports (display: grid){.b1{color:blue}}}}"`,
    );
  });

  it("renders sibling and descendant combinator nesting (C5)", () => {
    const renderer = new Engine();

    renderer.addStyle({ "+ .sibling": { color: "red" } });
    renderer.addStyle({ "~ .general": { color: "blue" } });
    renderer.addStyle({ " .child": { color: "green" } });

    const blocks = renderer.caches.rule.items();
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `".a1+ .sibling{color:red}.b1~ .general{color:blue}.c1 .child{color:green}"`,
    );
  });

  it("substitutes & for the class name in prefixed-context nesting (C5)", () => {
    const renderer = new Engine();

    renderer.addStyle({ ".parent &": { color: "red" } });
    // Longhand property keeps its specificity bump under the substituted &.
    renderer.addStyle({ ".dark &": { marginTop: "1px" } });

    const blocks = renderer.caches.rule.items();
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `".parent .a1{color:red}.dark .b1.b1{margin-top:1px}"`,
    );
  });

  it("substitutes & for the selector in static prefixed-context nesting (C5)", () => {
    const renderer = new Engine();

    renderer.addStatic(".foo", {
      ".parent &": { color: "red" },
    });

    const blocks = renderer.caches.static.items();
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(`".parent .foo{color:red;}"`);
  });

  it("should handle all types of at-rules", () => {
    const renderer = new Engine();

    renderer.addStyle({
      "@media (min-width: 100px)": {
        background: "green",
        "@supports (display: grid)": {
          "@container (min-width: 100px)": {
            color: "green",
          },
        },
      },
    });

    renderer.addStyle({
      "@container (min-width: 100px)": {
        background: "green",
        "@media (min-width: 100px)": {
          color: "green",
          "@supports (display: grid)": {
            color: "green",
          },
        },
      },
    });

    // printStyleBlock assumes a sorted array of blocks.
    const blocks = sortAtRules(renderer.caches.rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px){@container (min-width: 100px){.d1{color:green}@supports (display: grid){.b1{color:green}}}.a1{background:green}}@container (min-width: 100px){.c1{background:green}}"`,
    );
  });
});
