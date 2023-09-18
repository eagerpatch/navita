import type { Adapter} from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { createTheme, createThemeContract } from '../../src';

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

      expect(className).toBe(`.${generatedIdentifier}`);
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
});
