import { createVar, fallbackVar } from "../../src/vars";

describe('vars', () => {
  describe('createVar', () => {
    it('should create vars', () => {
      expect(createVar('cool-var-name')).toBe('var(--cool-var-name)');
      expect(createVar('coolVarName')).toBe('var(--coolVarName)');
    });
  });

  // These tests are from vanilla-extract:
  // https://github.com/vanilla-extract-css/vanilla-extract/blob/0d0ea3909e7f952f24aafa4c9653853ac5841b8c/packages/css/src/vars.test.ts#LL3C1-L69C4
  describe('fallbackVar', () => {
    it('supports a single string fallback', () => {
      expect(fallbackVar('var(--foo-bar)', 'blue')).toMatchInlineSnapshot(
        `"var(--foo-bar, blue)"`,
      );
    });

    it('supports a single numeric fallback', () => {
      expect(fallbackVar('var(--foo-bar)', '10px')).toMatchInlineSnapshot(
        `"var(--foo-bar, 10px)"`,
      );
    });

    it('supports a single var fallback', () => {
      expect(fallbackVar('var(--foo-bar)', 'var(--baz)')).toMatchInlineSnapshot(
        `"var(--foo-bar, var(--baz))"`,
      );
    });

    it('supports multiple fallbacks resolving to a string', () => {
      expect(
        fallbackVar('var(--foo)', 'var(--bar)', 'var(--baz)', 'blue'),
      ).toMatchInlineSnapshot(`"var(--foo, var(--bar, var(--baz, blue)))"`);
    });

    it('supports multiple fallbacks resolving to a number', () => {
      expect(
        fallbackVar('var(--foo)', 'var(--bar)', 'var(--baz)', '10px'),
      ).toMatchInlineSnapshot(`"var(--foo, var(--bar, var(--baz, 10px)))"`);
    });

    it('supports multiple fallbacks resolving to a var', () => {
      expect(
        fallbackVar(
          'var(--foo)',
          'var(--bar)',
          'var(--baz)',
          'var(--final-fallback)',
        ),
      ).toMatchInlineSnapshot(
        `"var(--foo, var(--bar, var(--baz, var(--final-fallback))))"`,
      );
    });

    it('should throw with invalid vars', () => {
      expect(() => {
        fallbackVar('INVALID', '10px');
      }).toThrowErrorMatchingInlineSnapshot(`"Invalid variable name: INVALID"`);

      expect(() => {
        fallbackVar('INVALID1', 'INVALID2', '10px');
      }).toThrowErrorMatchingInlineSnapshot(`"Invalid variable name: INVALID2"`);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        fallbackVar('INVALID', 10, 10);
      }).toThrowErrorMatchingInlineSnapshot(`"Invalid variable name: 10"`);

      expect(() => {
        fallbackVar('var(--foo-bar)', 'INVALID', '10px');
      }).toThrowErrorMatchingInlineSnapshot(`"Invalid variable name: INVALID"`);

      expect(() => {
        fallbackVar('INVALID', 'var(--foo-bar)', '10px');
      }).toThrowErrorMatchingInlineSnapshot(`"Invalid variable name: INVALID"`);
    });
  });
});
