import { splitStyleBlocks } from "../../../src/helpers/splitStyleBlocks";
import type { StyleBlock } from "../../../src/types";

describe('splitStyleBlocks', () => {
  it('should split at-rules and rules', () => {
    const blocks = [
      {
        id: '1',
        property: '',
      },
      {
        id: '2',
        property: '',
        media: 'something'
      },
      {
        id: '3',
        property: '',
        support: 'something'
      },
      {
        id: '4',
        property: '',
        media: 'something',
        support: 'something'
      },
      {
        id: '5',
        property: 'all',
      }
    ] as StyleBlock[];

    const { atRules, rules, lowPrioRules } = splitStyleBlocks(blocks);

    expect(atRules.length).toBe(3);
    expect(rules.length).toBe(1);
    expect(lowPrioRules.length).toBe(1);
    expect(atRules.map((x) => x.id)).toEqual(['2', '3', '4']);
    expect(rules.map((x) => x.id)).toEqual(['1']);
    expect(lowPrioRules.map((x) => x.id)).toEqual(['5']);
  });
});
