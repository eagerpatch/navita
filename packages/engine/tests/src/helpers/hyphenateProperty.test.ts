import { hyphenateProperty } from "../../../src/helpers/hyphenateProperty";

describe("hypenateProperty", () => {
  it("should return the same value if it is already hyphenated", () => {
    expect(hyphenateProperty("background-color")).toBe("background-color");
  });

  it("should hyphenate camelCase", () => {
    expect(hyphenateProperty("backgroundColor")).toBe("background-color");
  });

  it('ms- prefix should be lowercase', () => {
    expect(hyphenateProperty('msBackground')).toBe('-ms-background');
  });

  it(`doesn't hyphenate css vars`, () => {
    expect(hyphenateProperty('--myVar')).toBe('--myVar');
  });
});
