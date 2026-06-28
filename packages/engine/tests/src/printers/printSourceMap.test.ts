import { printSourceMap } from "../../../src/printers/printSourceMap";

describe("printSourceMap", () => {
  it("returns empty content untouched (no source map appended)", () => {
    const references = { "a.ts": [{ selector: ".a1", line: 1, column: 0 }] };
    expect(printSourceMap(references, "")).toBe("");
  });

  it("returns content untouched when there are no references", () => {
    expect(printSourceMap({}, ".a1{color:red}")).toBe(".a1{color:red}");
  });

  it("appends per-reference marker rules and a sourceMappingURL", () => {
    const result = printSourceMap(
      { "a.ts": [{ selector: ".a1", line: 3, column: 2 }] },
      ".a1{color:red}",
    );

    // Original content is preserved at the start.
    expect(result.startsWith(".a1{color:red}")).toBe(true);
    // A marker rule is appended for the reference.
    expect(result).toContain(".a1{/* Only used for sourceMap */}");
    // And an inline base64 source map reference is appended.
    expect(result).toContain(
      "/*# sourceMappingURL=data:application/json;base64,",
    );
  });

  it("embeds a decodable source map that references the source files", () => {
    const result = printSourceMap(
      {
        "a.ts": [{ selector: ".a1", line: 1, column: 0 }],
        "b.ts": [{ selector: ".b1", line: 2, column: 4 }],
      },
      ".a1{color:red}.b1{color:blue}",
    );

    const match = result.match(
      /sourceMappingURL=data:application\/json;base64,([^ ]+) \*\//,
    );
    expect(match).not.toBeNull();

    const decoded = JSON.parse(
      Buffer.from(match![1], "base64").toString("utf-8"),
    );
    expect(decoded.file).toBe("navita.css");
    expect(decoded.sources).toEqual(expect.arrayContaining(["a.ts", "b.ts"]));
  });
});
