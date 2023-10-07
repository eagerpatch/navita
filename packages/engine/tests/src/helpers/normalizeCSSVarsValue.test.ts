import { normalizeCSSVarsValue } from "../../../src/helpers/normalizeCSSVarsValue";

describe('normalizeCSSVarsValue', () => {
  it('should only replace css var with var() if it is not already', () => {
    expect(normalizeCSSVarsValue('var(--my-var)')).toBe('var(--my-var)');
    expect(normalizeCSSVarsValue('--my-var')).toBe('var(--my-var)');
    expect(normalizeCSSVarsValue('var(--my-var) var(--my-var)')).toBe('var(--my-var) var(--my-var)');
    expect(normalizeCSSVarsValue('var(--my-var) --my-var')).toBe('var(--my-var) var(--my-var)');
    expect(normalizeCSSVarsValue('--my-var var(--my-var)')).toBe('var(--my-var) var(--my-var)');
    expect(normalizeCSSVarsValue('--my-var --my-var')).toBe('var(--my-var) var(--my-var)');
  });

  it('should work with css vars in real life', () => {
    expect(normalizeCSSVarsValue('0px 2px 0px --box-shadow-color')).toBe('0px 2px 0px var(--box-shadow-color)');
    expect(normalizeCSSVarsValue('0px 2px 0px var(--box-shadow-color)')).toBe('0px 2px 0px var(--box-shadow-color)');
    expect(normalizeCSSVarsValue('var(--box-shadow-color) 0px 2px 0px')).toBe('var(--box-shadow-color) 0px 2px 0px');
  });

  it('should work with fallback vars', () => {
    expect(normalizeCSSVarsValue('var(--my-var, --this-is-wrong)')).toBe('var(--my-var, var(--this-is-wrong))');
    expect(normalizeCSSVarsValue('var(--my-var,--this-is-wrong)')).toBe('var(--my-var,var(--this-is-wrong))');
  });
});
