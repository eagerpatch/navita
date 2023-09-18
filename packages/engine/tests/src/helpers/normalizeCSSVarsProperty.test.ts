import { normalizeCSSVarsProperty } from "../../../src/helpers/normalizeCSSVarsProperty";

describe('normalizeCSSVarsProperty', () => {
  it('should ignore if property does not start with var(', () => {
    expect(normalizeCSSVarsProperty('color')).toBe('color');
    expect(normalizeCSSVarsProperty('background')).toBe('background');
  });

  it('should work with regular CSSVars', () => {
    expect(normalizeCSSVarsProperty('var(--color)')).toBe('--color');
    expect(normalizeCSSVarsProperty('var(--background)')).toBe('--background');
  });

  it('should work with CSSVars with fallbacks', () => {
    expect(normalizeCSSVarsProperty('var(--color, red)')).toBe('--color');
    expect(normalizeCSSVarsProperty('var(--background, blue)')).toBe('--background');
  });

  it('should work with nested CSSVars', () => {
    expect(normalizeCSSVarsProperty('var(--color, var(--background))')).toBe('--color');
    expect(normalizeCSSVarsProperty('var(--background, var(--color))')).toBe('--background');
  });

  it('should work with super nested CSSVars', () => {
    expect(normalizeCSSVarsProperty('var(--color, var(--theme-color, var(--theme-color-2, blue)))')).toBe('--color');
    expect(normalizeCSSVarsProperty('var(--background, var(--theme-background, var(--theme-background-2, green)))')).toBe('--background');
  });
});
