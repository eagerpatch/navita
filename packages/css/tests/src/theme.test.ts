import type { Adapter} from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { createGlobalThemeContract, createTheme, createThemeContract } from "../../src";

describe('theme', () => {
  describe('createThemeContract', () => {
    it('should create a theme contract', () => {
      const theme = createThemeContract({
        color: {
          primary: null,
        },
        sizes: {
          regular: null,
          text: null,
          bigger: null,
        },
      });

      expect(theme).toMatchInlineSnapshot(`
        {
          "color": {
            "primary": "var(--color-primary)",
          },
          "sizes": {
            "bigger": "var(--sizes-bigger)",
            "regular": "var(--sizes-regular)",
            "text": "var(--sizes-text)",
          },
        }
      `);
    });
  });

  describe('createTheme', () => {
    it('should create a theme', () => {
      const addStaticCss = jest.fn();
      const generatedIdentifier = 'theme-identifier';

      setAdapter({
        generateIdentifier: () => generatedIdentifier,
        addStaticCss,
      } as unknown as Adapter);

      const [className, vars] = createTheme({
        color: {
          primary: 'red',
        },
      });

      expect(className).toBe(generatedIdentifier);
      expect(addStaticCss).toHaveBeenCalledWith(`.${generatedIdentifier}`, {
        "--color-primary": "red",
      });
      expect(vars).toMatchInlineSnapshot(`
        {
          "color": {
            "primary": "var(--color-primary)",
          },
        }
      `);
    });
  });

  // All of these tests are from vanilla-extract
  describe('createGlobalThemeContract', () => {
    it('supports defining css vars via object properties', () => {
      expect(
        createGlobalThemeContract({
          color: {
            red: 'color-red',
            blue: 'color-blue',
            green: 'color-green',
          },
        }),
      ).toMatchInlineSnapshot(`
      {
        "color": {
          "blue": "var(--color-blue)",
          "green": "var(--color-green)",
          "red": "var(--color-red)",
        },
      }
    `);
    });

    it('ignores leading double hyphen', () => {
      expect(
        createGlobalThemeContract({
          color: {
            red: '--color-red',
            blue: '--color-blue',
            green: '--color-green',
          },
        }),
      ).toMatchInlineSnapshot(`
      {
        "color": {
          "blue": "var(--color-blue)",
          "green": "var(--color-green)",
          "red": "var(--color-red)",
        },
      }
    `);
    });

    it('supports adding a prefix', () => {
      expect(
        createGlobalThemeContract(
          {
            color: {
              red: 'color-red',
              blue: 'color-blue',
              green: 'color-green',
            },
          },
          (value) => `prefix-${value}`,
        ),
      ).toMatchInlineSnapshot(`
      {
        "color": {
          "blue": "var(--prefix-color-blue)",
          "green": "var(--prefix-color-green)",
          "red": "var(--prefix-color-red)",
        },
      }
    `);
    });

    it('ignores leading double hyphen when adding a prefix', () => {
      expect(
        createGlobalThemeContract(
          {
            color: {
              red: 'color-red',
              blue: 'color-blue',
              green: 'color-green',
            },
          },
          (value) => `--prefix-${value}`,
        ),
      ).toMatchInlineSnapshot(`
      {
        "color": {
          "blue": "var(--prefix-color-blue)",
          "green": "var(--prefix-color-green)",
          "red": "var(--prefix-color-red)",
        },
      }
    `);
    });

    it('supports path based names', () => {
      expect(
        createGlobalThemeContract(
          {
            color: {
              red: null,
              blue: null,
              green: null,
            },
          },
          (_, path) => `prefix-${path.join('-')}`,
        ),
      ).toMatchInlineSnapshot(`
      {
        "color": {
          "blue": "var(--prefix-color-blue)",
          "green": "var(--prefix-color-green)",
          "red": "var(--prefix-color-red)",
        },
      }
    `);
    });

    it('errors when invalid property value', () => {
      expect(() =>
        createGlobalThemeContract({
          color: {
            red: null,
            blue: 'color-blue',
            green: 'color-green',
          },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid variable name for "color.red": null"`,
      );
    });

    it('errors when escaped property value', () => {
      expect(() =>
        createGlobalThemeContract({
          color: {
            red: 'color-red',
            blue: "color'blue",
            green: 'color-green',
          },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid variable name for "color.blue": color'blue"`,
      );
    });

    it('errors when property value starts with a number', () => {
      expect(() =>
        createGlobalThemeContract({
          color: {
            red: 'color-red',
            blue: 'color-blue',
            green: '123-color-green',
          },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid variable name for "color.green": 123-color-green"`,
      );
    });

    it('errors when invalid map value', () => {
      expect(() =>
        createGlobalThemeContract(
          {
            color: {
              red: 'color-red',
              blue: 'color-blue',
              green: 'color-green',
            },
          },
          () => null,
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid variable name for "color.red": null"`,
      );
    });
  });
});
