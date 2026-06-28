import { addCss } from "@navita/adapter";
import type { StyleRule } from "@navita/types";

export function style(rule: StyleRule) {
  return addCss(rule);
}
