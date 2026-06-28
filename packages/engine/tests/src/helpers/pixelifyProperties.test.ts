import { pixelifyProperties } from "../../../src/helpers/pixelifyProperties";

describe("pixelifyProperties", () => {
  it("appends px to numeric values of regular properties", () => {
    expect(pixelifyProperties("width", 10)).toBe("10px");
    expect(pixelifyProperties("margin-top", 4)).toBe("4px");
  });

  it("leaves 0 unitless", () => {
    expect(pixelifyProperties("width", 0)).toBe(0);
  });

  it("leaves known unitless properties alone", () => {
    expect(pixelifyProperties("lineHeight", 1.5)).toBe(1.5);
    expect(pixelifyProperties("zIndex", 10)).toBe(10);
    expect(pixelifyProperties("opacity", 1)).toBe(1);
  });

  it("does not pixelate custom properties", () => {
    // vanilla-extract keeps custom properties unitless — the engine cannot know
    // how the var will be consumed, so it must not append a unit.
    expect(pixelifyProperties("--gap", 16)).toBe(16);
    expect(pixelifyProperties("--z-index", 10)).toBe(10);
    expect(pixelifyProperties("--my-custom-prop", 42)).toBe(42);
  });
});
