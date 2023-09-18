import { addKeyframe } from "@navita/adapter";
import type { CSSKeyframes } from "@navita/types";

export function keyframes(rule: CSSKeyframes) {
  return addKeyframe(rule);
}
