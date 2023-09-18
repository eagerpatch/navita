import { sortAtRules } from "../../../src/printers/sortAtRules";
import type { StyleBlock } from "../../../src/types";

describe('sortAtRules', () => {
  const createBlock = (data: Partial<StyleBlock> = {}) => {
    return ({
      id: '',
      type: 'rule',
      selector: '',
      declaration: 'some:declaration',
      property: '',
      pseudo: '',
      media: '',
      support: '',
      ...data,
    }) as const;
  }

  it('should sort rules', () => {
    const blocks: StyleBlock[] = [
      createBlock({ id: 'a', media: '(min-width: 200px)' }),
      createBlock({ id: 'b', media: '(min-width: 300px)' }),
      createBlock({ id: 'c', media: '(min-width: 100px)', support: 'y' }),
      createBlock({ id: 'd', media: '(min-width: 100px)', support: 'x' }),
    ];

    expect(sortAtRules(blocks).map(x => x.id)).toEqual(['d', 'c', 'a', 'b']);
  });
});
