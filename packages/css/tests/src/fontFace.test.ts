import type { Adapter } from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { vi } from "vitest";
import { fontFace } from "../../src";

describe("fontFace", () => {
  it("delegates a single font face rule to addFontFace and returns the family name", () => {
    const addFontFace = vi.fn().mockReturnValue('"My Font"');
    setAdapter({ addFontFace } as unknown as Adapter);

    const rule = { src: "url(my-font.woff2)", fontWeight: 400 };
    const result = fontFace(rule);

    expect(addFontFace).toHaveBeenCalledTimes(1);
    expect(addFontFace).toHaveBeenCalledWith(rule);
    expect(result).toBe('"My Font"');
  });

  it("delegates an array of font face rules unchanged", () => {
    const addFontFace = vi.fn().mockReturnValue('"My Font"');
    setAdapter({ addFontFace } as unknown as Adapter);

    const rules = [
      { src: "url(a.woff2)", fontWeight: 400 },
      { src: "url(b.woff2)", fontWeight: 700 },
    ];
    const result = fontFace(rules);

    expect(addFontFace).toHaveBeenCalledWith(rules);
    expect(result).toBe('"My Font"');
  });
});
