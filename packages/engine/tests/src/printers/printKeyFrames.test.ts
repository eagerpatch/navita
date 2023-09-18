import { printKeyFrames } from '../../../src/printers/printKeyFrames';
import type { KeyframesBlock } from '../../../src/types';

describe('printKeyFrames', () => {
  it('should print keyframes', () => {
    const blocks: KeyframesBlock[] = [
      {
        id: 'a',
        type: 'keyframes',
        rule: {
          from: {
            color: 'red',
          },
          to: {
            color: 'blue',
          },
        },
      },
    ];

    expect(printKeyFrames(blocks)).toMatchInlineSnapshot(
      `"@keyframes a{from{color:red}to{color:blue}}"`,
    );
  });

  it('should also work with multiple keyframes', () => {
    const blocks: KeyframesBlock[] = [
      {
        id: 'a',
        type: 'keyframes',
        rule: {
          from: {
            color: 'red',
          },
          to: {
            color: 'blue',
          },
        },
      },
      {
        id: 'b',
        type: 'keyframes',
        rule: {
          '0%': {
            color: 'red',
          },
          '50%': {
            color: 'green',
          },
          '100%': {
            color: 'blue',
          },
        },
      },
    ];

    expect(printKeyFrames(blocks)).toMatchInlineSnapshot(
      `"@keyframes a{from{color:red}to{color:blue}}@keyframes b{0%{color:red}50%{color:green}100%{color:blue}}"`,
    );
  });
});
