import { splitStyleBlocks } from "../../../src/helpers/splitStyleBlocks";
import type { StyleBlock } from "../../../src/types";

describe('splitStyleBlocks', () => {
  it('should split at-rules and rules', () => {
    const blocks = [
      {
        id: '1',
      },
      {
        id: '2',
        media: 'something'
      },
      {
        id: '3',
        support: 'something'
      },
      {
        id: '4',
        media: 'something',
        support: 'something'
      }
    ] as StyleBlock[];

    const { atRules, rules } = splitStyleBlocks(blocks);

    expect(atRules.length).toBe(3);
    expect(rules.length).toBe(1);
    expect(atRules.map((x) => x.id)).toEqual(['2', '3', '4']);
    expect(rules.map((x) => x.id)).toEqual(['1']);
  });
});
