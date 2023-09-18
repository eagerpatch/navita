import { generateCombinedAtRules } from "../../../src/helpers/generateCombinedAtRules";

describe('generateCombinedAtRules', () => {
  it('should return the nested media query if the current media query is empty', () => {
    expect(generateCombinedAtRules('', '(min-width: 500px)')).toBe('(min-width: 500px)');
  });

  it('should combine at-rules', () => {
    expect(generateCombinedAtRules('(min-width: 500px)', '(min-width: 600px)')).toBe('(min-width: 500px) and (min-width: 600px)');
  });

  it('should combine at-rules with multiple queries', () => {
    expect(generateCombinedAtRules('(min-width: 500px) and (min-width: 600px)', '(min-width: 700px)')).toBe('(min-width: 500px) and (min-width: 600px) and (min-width: 700px)');
  });
});
