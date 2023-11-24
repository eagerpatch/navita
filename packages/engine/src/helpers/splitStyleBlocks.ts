import type { StyleBlock } from "../types";

const lowPriorityProperties = ['all'];

export function splitStyleBlocks(blocks: StyleBlock[]) {
  const atRules: StyleBlock[] = [];
  const rules: StyleBlock[] = [];
  const lowPrioRules: StyleBlock[] = [];

  for (const block of blocks) {
    if (block.media || block.support) {
      atRules.push(block);
      continue;
    }

    if (lowPriorityProperties.includes(block.property.toLowerCase())) {
      lowPrioRules.push(block);
      continue;
    }

    rules.push(block);
  }

  return { atRules, lowPrioRules, rules };
}
