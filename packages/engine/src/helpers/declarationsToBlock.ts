import { hyphenateProperty } from "./hyphenateProperty";

// https://github.com/styletron/styletron/blob/b552ddc5050a8cc5eec84a46a299d937d3bb0112/packages/styletron-engine-atomic/src/css.ts#L36
export function declarationsToBlock(style: Record<string, string | number>): string {
  let css = "";

  for (const prop in style) {
    const val = style[prop];
    if (typeof val === "string" || typeof val === "number") {
      css += `${hyphenateProperty(prop)}:${val};`;
    }
  }

  return css.slice(0, -1);
}
