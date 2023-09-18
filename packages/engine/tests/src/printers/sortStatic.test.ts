import { Engine } from "../../../src";
import { sortStatic } from "../../../src/printers/sortStatic";
import type { StyleBlock } from "../../../src/types";

describe('sortStatic', () => {
  const createBlock = (data: Partial<StyleBlock>) => ({
    id: 0,
    type: 'static',
    selector: '',
    declaration: '',
    property: '',
    pseudo: '',
    media: '',
    support: '',
    ...data,
  }) as const;

  it('should sort selectors and sort by id', () => {
    const blocks: StyleBlock[] = [
      createBlock({ id: 5, selector: '.c' }),
      createBlock({ id: 4, selector: '.b' }),
      createBlock({ id: 3, selector: '.b' }),
      createBlock({ id: 2, selector: '.a' }),
      createBlock({ id: 6, selector: '.c' }),
      createBlock({ id: 1, selector: '.a' }),
    ];

    const sorted = sortStatic(blocks);

    expect(sorted.map(x => x.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('when we have media queries etc, ID order might be funky', () => {
    const renderer = new Engine();

    renderer.addStatic('html', {
      color: 'red',
      '@media (min-width: 100px)': {
        color: 'blue',
        backgroundColor: 'green',
        '@media (max-width: 300px)': {
          color: 'green',
          backgroundColor: 'yellow',
        }
      }
    });

    const items = renderer['caches'].static.items();

    expect(items.map(x => x.id)).toEqual(sortStatic(items).map(x => x.id));
  });
});
