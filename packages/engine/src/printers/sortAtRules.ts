import type * as sortCSSmq from "sort-css-media-queries";
import createSort from "sort-css-media-queries/lib/create-sort.js";
import type { StyleBlock } from "../types";

const sortCSSMediaQueries = createSort() as typeof sortCSSmq;

export function sortAtRules(blocks: StyleBlock[]) {
  return blocks.sort(
    (a, b) => (
      sortCSSMediaQueries(a.media, b.media) ||
      sortCSSMediaQueries(a.container, b.container) ||
      a.support.localeCompare(b.support)
    )
  );
}
