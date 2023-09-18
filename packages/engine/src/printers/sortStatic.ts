import type { StyleBlock } from "../types";

type NarrowedStyleBlock = StyleBlock & {
  id: number;
};

export function sortStatic(blocks: StyleBlock[]) {
  return blocks.sort((a: NarrowedStyleBlock, b: NarrowedStyleBlock) => a.id - b.id);
}
