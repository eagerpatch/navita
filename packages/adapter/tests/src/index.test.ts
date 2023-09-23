import type { Adapter } from "../../src";
import {
  collectResult,
  generateIdentifier,
  setAdapter,
  addCss,
  addFontFace,
  addKeyframe,
  addStaticCss
} from "../../src";

describe('adapter', () => {
  it('should throw error without adapter', () => {
    expect(() => generateIdentifier('something')).toThrowError();
    expect(() => addCss({})).toThrowError();
    // noinspection JSVoidFunctionReturnValueUsed
    expect(() => addStaticCss('selector', {})).toThrowError();
    expect(() => addKeyframe({})).toThrowError();
    expect(() => addFontFace({
      src: '',
    })).toThrowError();
    expect(() => collectResult({
      index: 0,
      identifier: '',
      sourceMap: {
        line: 0,
        column: 0,
      },
      position: [0, 0],
      filePath: "",
      result: () => undefined
    })).toThrowError();
  });

  it('should set adapter', () => {
    setAdapter({
      generateIdentifier: () => 'something',
      addCss: () => 'something',
      addStaticCss: () => 'something',
      addKeyframe: () => 'something',
      addFontFace: () => 'something',
      collectResult: () => 'something',
    } as unknown as Adapter);

    expect(generateIdentifier('anything')).toBe('something');
    expect(addCss({})).toBe('something');
    // noinspection JSVoidFunctionReturnValueUsed
    expect(addStaticCss('selector', {})).toBe('something');
    expect(addKeyframe({})).toBe('something');
    expect(addFontFace({
      src: '',
    })).toBe('something');
    expect(collectResult({
      index: 0,
      filePath: "",
      identifier: '',
      sourceMap: {
        line: 0,
        column: 0,
      },
      position: [0, 0],
      result: () => undefined,
    })).toBe('something');
  });
});
