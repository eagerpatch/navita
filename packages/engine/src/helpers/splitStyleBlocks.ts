import type { StyleBlock } from "../types";

export function splitStyleBlocks(blocks: StyleBlock[]) {
  const atRules: StyleBlock[] = [];
  const rules: StyleBlock[] = [];

  for (const block of blocks) {
    if (block.media || block.support) {
      atRules.push(block);
    } else {
      rules.push(block);
    }
  }

  return { atRules, rules };
}
