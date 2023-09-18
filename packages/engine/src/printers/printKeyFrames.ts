import type { CSSKeyframes } from "@navita/types";
import { declarationsToBlock } from "../helpers/declarationsToBlock";
import type { KeyframesBlock } from "../types";

// https://github.com/styletron/styletron/blob/master/packages/styletron-engine-atomic/src/css.ts#L48
function keyframesToBlock(keyframes: CSSKeyframes): string {
  let result = "";

  for (const animationState in keyframes) {
    result += `${animationState}{${declarationsToBlock(keyframes[animationState])}}`;
  }

  return result;
}

export function printKeyFrames(blocks: KeyframesBlock[]): string {
  let keyframes = '';

  for (const block of blocks) {
    keyframes += `@keyframes ${block.id}{${keyframesToBlock(block.rule)}}`;
  }

  return keyframes;
}
