import { addStaticCss } from "@navita/adapter";
import type { GlobalStyleRule } from "@navita/types";

export function globalStyle(
  selector: string,
  rule: GlobalStyleRule
) {
  addStaticCss(selector, rule);
}
