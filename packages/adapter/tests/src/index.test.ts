import { vi } from "vitest";
import type { Adapter } from "../../src";
import {
  addCss,
  addFontFace,
  addKeyframe,
  addStaticCss,
  collectResult,
  generateIdentifier,
  setAdapter,
} from "../../src";

describe("adapter", () => {
  it("should throw error without adapter", () => {
    expect(() => generateIdentifier("something")).toThrowError();
    expect(() => addCss({})).toThrowError();
    // noinspection JSVoidFunctionReturnValueUsed
    expect(() => addStaticCss("selector", {})).toThrowError();
    expect(() => addKeyframe({})).toThrowError();
    expect(() =>
      addFontFace({
        src: "",
      }),
    ).toThrowError();
    expect(() =>
      collectResult({
        index: 0,
        identifier: "",
        sourceMap: {
          line: 0,
          column: 0,
        },
        position: [0, 0],
        filePath: "",
        result: () => undefined,
      }),
    ).toThrowError();
  });

  it("should set adapter", () => {
    setAdapter({
      generateIdentifier: () => "something",
      addCss: () => "something",
      addStaticCss: () => "something",
      addKeyframe: () => "something",
      addFontFace: () => "something",
      collectResult: () => "something",
    } as unknown as Adapter);

    expect(generateIdentifier("anything")).toBe("something");
    expect(addCss({})).toBe("something");
    // noinspection JSVoidFunctionReturnValueUsed
    expect(addStaticCss("selector", {})).toBe("something");
    expect(addKeyframe({})).toBe("something");
    expect(
      addFontFace({
        src: "",
      }),
    ).toBe("something");
    expect(
      collectResult({
        index: 0,
        filePath: "",
        identifier: "",
        sourceMap: {
          line: 0,
          column: 0,
        },
        position: [0, 0],
        result: () => undefined,
      }),
    ).toBe("something");
  });
});

describe("adapter delegation", () => {
  it("forwards each accessor call (and its arguments) to the set adapter", () => {
    const mockAdapter = {
      generateIdentifier: vi.fn(() => "generated-id"),
      addCss: vi.fn(() => "css-class"),
      addStaticCss: vi.fn(() => "static-class"),
      addKeyframe: vi.fn(() => "keyframe-name"),
      addFontFace: vi.fn(() => "font-family-name"),
      collectResult: vi.fn((input: { result: () => unknown }) =>
        input.result(),
      ),
    };

    setAdapter(mockAdapter as unknown as Adapter);

    expect(generateIdentifier({ token: 1 })).toBe("generated-id");
    expect(mockAdapter.generateIdentifier).toHaveBeenCalledTimes(1);
    expect(mockAdapter.generateIdentifier).toHaveBeenCalledWith({ token: 1 });

    expect(addCss({ color: "red" })).toBe("css-class");
    expect(mockAdapter.addCss).toHaveBeenCalledTimes(1);
    expect(mockAdapter.addCss).toHaveBeenCalledWith({ color: "red" });

    // noinspection JSVoidFunctionReturnValueUsed
    expect(addStaticCss(".selector", { color: "blue" })).toBe("static-class");
    expect(mockAdapter.addStaticCss).toHaveBeenCalledTimes(1);
    expect(mockAdapter.addStaticCss).toHaveBeenCalledWith(".selector", {
      color: "blue",
    });

    expect(addKeyframe({ from: { opacity: 0 }, to: { opacity: 1 } })).toBe(
      "keyframe-name",
    );
    expect(mockAdapter.addKeyframe).toHaveBeenCalledTimes(1);
    expect(mockAdapter.addKeyframe).toHaveBeenCalledWith({
      from: { opacity: 0 },
      to: { opacity: 1 },
    });

    const fontFace = { src: "url(font.woff2)" };
    expect(addFontFace(fontFace)).toBe("font-family-name");
    expect(mockAdapter.addFontFace).toHaveBeenCalledTimes(1);
    expect(mockAdapter.addFontFace).toHaveBeenCalledWith(fontFace);

    const collectInput = {
      index: 2,
      filePath: "/some/file.ts",
      identifier: "ident",
      sourceMap: { line: 4, column: 8 },
      position: [10, 20] as [number, number],
      result: () => "collected-value",
    };
    expect(collectResult(collectInput)).toBe("collected-value");
    expect(mockAdapter.collectResult).toHaveBeenCalledTimes(1);
    expect(mockAdapter.collectResult).toHaveBeenCalledWith(collectInput);
  });

  it("returns undefined from collectResult when the adapter omits it (optional delegation)", () => {
    const resultFactory = vi.fn(() => "never-collected");

    setAdapter({
      generateIdentifier: vi.fn(() => "id"),
      addCss: vi.fn(() => "css"),
      addStaticCss: vi.fn(() => "static"),
      addKeyframe: vi.fn(() => "kf"),
      addFontFace: vi.fn(() => "ff"),
      // collectResult intentionally omitted — it is optional on Adapter.
    } as unknown as Adapter);

    expect(
      collectResult({
        index: 0,
        filePath: "",
        identifier: "",
        sourceMap: { line: 0, column: 0 },
        position: [0, 0],
        result: resultFactory,
      }),
    ).toBeUndefined();
    // The optional-chaining short-circuits before the result factory runs.
    expect(resultFactory).not.toHaveBeenCalled();
  });
});
