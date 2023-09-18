import { declarationsToBlock } from "../helpers/declarationsToBlock";
import type { FontFaceBlock } from "../types";

export function printFontFaces(blocks: FontFaceBlock[]) {
  let fontFaces = '';

  for (const block of blocks) {
    for (const rule of block.rule) {
      fontFaces += `@font-face{font-family:${block.id};${declarationsToBlock(rule as Record<string, string>)}}`;
    }
  }

  return fontFaces;
}
