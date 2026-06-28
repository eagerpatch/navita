import { vi } from "vitest";
import { walkObject } from "../../src/helpers/walkObject";

describe("walkObject", () => {
  it("calls the transform for every leaf with its value and dotted path", () => {
    const transform = vi.fn((value, path) => `${path.join(".")}=${value}`);

    const result = walkObject({ a: 1, b: { c: "x" } }, transform);

    expect(result).toEqual({ a: "a=1", b: { c: "b.c=x" } });
    expect(transform).toHaveBeenCalledWith(1, ["a"]);
    expect(transform).toHaveBeenCalledWith("x", ["b", "c"]);
    expect(transform).toHaveBeenCalledTimes(2);
  });

  it("treats string, number, null and undefined as leaves", () => {
    const transform = vi.fn(() => "mapped");

    const result = walkObject(
      { str: "a", num: 1, nil: null, undef: undefined },
      transform,
    );

    expect(result).toEqual({
      str: "mapped",
      num: "mapped",
      nil: "mapped",
      undef: "mapped",
    });
    expect(transform).toHaveBeenCalledWith(null, ["nil"]);
    expect(transform).toHaveBeenCalledWith(undefined, ["undef"]);
  });

  it("preserves deeply nested structure", () => {
    const result = walkObject(
      { a: { b: { c: { d: "deep" } } } },
      (value) => value,
    );

    expect(result).toEqual({ a: { b: { c: { d: "deep" } } } });
  });

  it("skips array-valued keys entirely (does not recurse into arrays)", () => {
    const transform = vi.fn(() => "mapped");

    const result = walkObject(
      { list: [1, 2, 3] as unknown as string, scalar: 5 },
      transform,
    );

    // The array key is neither transformed nor copied to the output.
    expect(result).toEqual({ scalar: "mapped" });
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transform).toHaveBeenCalledWith(5, ["scalar"]);
  });
});
