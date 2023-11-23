import { processKeyframes } from "../../src/processKeyframes";

describe('processKeyframes', () => {
  it('should transform content property value', () => {
    const x = processKeyframes({
      '0%': { content: '' },
      '25%': { content: '.' },
      '50%': { content: '..' },
      '75%': { content: '...' },
      '100%': { content: '' },
    });

    expect(x).toEqual({
      '0%': { content: '""' },
      '25%': { content: '"."' },
      '50%': { content: '".."' },
      '75%': { content: '"..."' },
      '100%': { content: '""' },
    });

    const y = processKeyframes({
      '0%': { content: '""' },
      '25%': { content: '"."' },
      '50%': { content: '".."' },
      '75%': { content: '"..."' },
      '100%': { content: '""' },
    });

    expect(y).toEqual({
      '0%': { content: '""' },
      '25%': { content: '"."' },
      '50%': { content: '".."' },
      '75%': { content: '"..."' },
      '100%': { content: '""' },
    });
  });

  it('still return expected result', () => {
    const x = processKeyframes({
      from: {
        opacity: 0,
      },
      to: {
        opacity: 1,
      }
    });

    expect(x).toEqual({
      from: {
        opacity: 0,
      },
      to: {
        opacity: 1,
      }
    });
  });
});
