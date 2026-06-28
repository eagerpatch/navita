import type { Adapter } from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { vi } from "vitest";
import { createGlobalTheme } from "../../src";

describe("createGlobalTheme", () => {
  describe("two-argument overload (selector, tokens)", () => {
    it("creates the var contract, writes the assignment under the selector, and returns the vars", () => {
      const addStaticCss = vi.fn();
      setAdapter({ addStaticCss } as unknown as Adapter);

      const vars = createGlobalTheme(":root", {
        color: { primary: "red" },
        space: { small: "4px" },
      });

      expect(addStaticCss).toHaveBeenCalledTimes(1);
      expect(addStaticCss).toHaveBeenCalledWith(":root", {
        "--color-primary": "red",
        "--space-small": "4px",
      });
      expect(vars).toEqual({
        color: { primary: "var(--color-primary)" },
        space: { small: "var(--space-small)" },
      });
    });
  });

  describe("three-argument overload (selector, contract, tokens)", () => {
    it("writes the assignment under the selector and returns void", () => {
      const addStaticCss = vi.fn();
      setAdapter({ addStaticCss } as unknown as Adapter);

      const contract = { color: { primary: "var(--color-primary)" } };
      const result = createGlobalTheme(".dark", contract, {
        color: { primary: "black" },
      });

      expect(addStaticCss).toHaveBeenCalledTimes(1);
      expect(addStaticCss).toHaveBeenCalledWith(".dark", {
        "--color-primary": "black",
      });
      expect(result).toBeUndefined();
    });

    it("throws when the tokens do not match the supplied contract", () => {
      const addStaticCss = vi.fn();
      setAdapter({ addStaticCss } as unknown as Adapter);

      expect(() =>
        createGlobalTheme(
          ".dark",
          { color: { primary: "var(--x)" } },
          {
            // @ts-expect-error - intentionally missing the `primary` token
            color: { secondary: "black" },
          },
        ),
      ).toThrowError(/Tokens don't match contract/);
      expect(addStaticCss).not.toHaveBeenCalled();
    });
  });
});
