import createSort from "sort-css-media-queries/lib/create-sort.js";
import type { StyleBlock } from "../types";

const sortCSSMediaQueries = createSort() as (a: string, b: string) => number;

export function sortAtRules(blocks: StyleBlock[]) {
  return blocks.sort(
    (a, b) =>
      sortCSSMediaQueries(a.media, b.media) ||
      sortCSSMediaQueries(a.container, b.container) ||
      a.support.localeCompare(b.support),
  );
}
