import { style } from '@navita/css';

describe('runtime', () => {
  it('should inject renderer during runtime', async () => {
    const className = style({
      background: 'red',
      color: 'green',
    });

    console.log('className', className);

    expect(className).toBe('a1 b1');
  });

  it('should do it isolated', () => {
    const className = style({
      background: 'red',
    });

    expect(className).toBe('a1');
  });

  it('works with snapshots', () => {
    const className = style({
      background: 'red',
    });

    expect(className).toMatchInlineSnapshot(`"a1"`);
  });
});
