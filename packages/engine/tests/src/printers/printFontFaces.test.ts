import { printFontFaces } from '../../../src/printers/printFontFaces';
import type { FontFaceBlock } from '../../../src/types';

describe('printFontFaces', () => {
  it('should print font faces', () => {
    const blocks: FontFaceBlock[] = [
      {
        id: 'a',
        type: 'fontFace',
        rule: [
          {
            src: 'local("Gentium")',
          },
        ],
      },
    ];

    expect(printFontFaces(blocks)).toMatchInlineSnapshot(
      `"@font-face{font-family:a;src:local("Gentium")}"`,
    );
  });

  it('should also work with multiple font faces', () => {
    const blocks: FontFaceBlock[] = [
      {
        id: 'a',
        type: 'fontFace',
        rule: [
          {
            src: 'local("Comic Sans MS")',
          },
        ],
      },
      {
        id: 'b',
        type: 'fontFace',
        rule: [
          {
            src: 'local("Gentium Bold")',
            fontWeight: 'bold',
          },
          {
            src: 'local("Gentium")',
            fontWeight: 'normal',
          },
        ],
      },
    ];

    expect(printFontFaces(blocks)).toMatchInlineSnapshot(
      `"@font-face{font-family:a;src:local("Comic Sans MS")}@font-face{font-family:b;src:local("Gentium Bold");font-weight:bold}@font-face{font-family:b;src:local("Gentium");font-weight:normal}"`,
    );
  });
});
