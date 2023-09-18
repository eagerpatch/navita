import { hyphenateProperty } from "../../../src/helpers/hypenateProperty";

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
});
