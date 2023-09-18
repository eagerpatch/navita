import { Engine } from '../../../src';
import { printStyleBlocks } from '../../../src/printers/printStyleBlocks';
import { sortAtRules } from '../../../src/printers/sortAtRules';

describe('printStyleBlock', () => {
  it('should handle nesting correctly', () => {
    const renderer = new Engine();
    renderer.addStyle({
      '@media (min-width: 100px)': {
        color: 'green',
      },
    });
    renderer.addStyle({
      '@supports (display: grid)': {
        color: 'yellow',
      },
    });
    renderer.addStyle({
      '@media (min-width: 100px)': {
        '@supports (display: grid)': {
          color: 'purple',
        },
        '@media (max-width: 300px)': {
          color: 'green',
        },
      },
    });

    // printStyleBlock assumes a sorted array of blocks.
    const blocks = sortAtRules(renderer['caches'].rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px){.a1{color:green}@supports (display: grid){.c1{color:purple}}}@media (min-width: 100px) and (max-width: 300px){.d1{color:green}}@supports (display: grid){.b1{color:yellow}}"`,
    );
  });

  it('should concat media queries', () => {
    const renderer = new Engine();
    renderer.addStyle({
      '@media (min-width: 100px)': {
        '@media (max-width: 300px)': {
          color: 'green',
        },
      },
    });

    // printStyleBlock assumes a sorted array of blocks.
    const blocks = sortAtRules(renderer['caches'].rule.items());
    const result = printStyleBlocks(blocks);

    expect(result).toMatchInlineSnapshot(
      `"@media (min-width: 100px) and (max-width: 300px){.a1{color:green}}"`,
    );
  });

  it('should be able to go from static without media query to static with media query', () => {
    const renderer = new Engine();

    renderer.addStatic(':root', {
      color: 'red',
    });

    renderer.addStatic(':root', {
      '@media (min-width: 100px)': {
        color: 'green',
      },
    });

    // Static rules are not sorted
    const blocks = renderer['caches'].static.items();
    const result = printStyleBlocks(blocks);
    expect(result).toMatchInlineSnapshot(
      `":root{color:red;}@media (min-width: 100px){:root{color:green;}}"`,
    );
  });

  it('should be able to render static rules with pseudos', () => {
    const renderer = new Engine();
    renderer.addStatic(':root', {
      color: 'green',
      backgroundColor: 'red',
      ':hover': {
        color: 'red',
      },
      '::before': {
        color: 'blue',
      },
      '::after': {
        color: 'black',
      },
    });
    renderer.addStatic('.something', {
      color: 'green',
    });

    const blocks = renderer['caches'].static.items();
    const result = printStyleBlocks(blocks);
    expect(result).toMatchInlineSnapshot(
      `":root{color:green;background-color:red;}:root:hover{color:red;}:root::before{color:blue;}:root::after{color:black;}.something{color:green;}"`,
    );
  });

  it('should handle long-hand and short-hand properties', () => {
    const renderer = new Engine();
    renderer.addStyle({
      margin: '10px',
    });
    renderer.addStyle({
      marginTop: '10px',
    });
    const blocks = renderer['caches'].rule.items();
    const result = printStyleBlocks(blocks);
    expect(result).toMatchInlineSnapshot(
      `".a1{margin:10px}.b1.b1{margin-top:10px}"`,
    );
  });
});
