/* eslint-disable @typescript-eslint/ban-ts-comment */
import { declarationsToBlock } from "../../../src/helpers/declarationsToBlock";

describe("declarationsToBlock", () => {
  it("should return a string", () => {
    expect(declarationsToBlock({})).toEqual("");
  });

  it("should create a string from key value pairs", () => {
    expect(declarationsToBlock({ a: 1, b: 2 })).toEqual("a:1;b:2");
  });

  it("should ignore non string and non number values", () => {
    expect(declarationsToBlock({
      a: 1,
      b: "2",
      // @ts-ignore
      c: true,
      d: undefined,
      e: null,
      // @ts-ignore
      f: {},
      // @ts-ignore
      g: []
    })).toEqual("a:1;b:2");
  });
});
