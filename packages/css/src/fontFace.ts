import { addFontFace } from "@navita/adapter";
import type { FontFaceRule } from "@navita/types";

export function fontFace(rule: FontFaceRule | FontFaceRule[]) {
  return addFontFace(rule);
}
