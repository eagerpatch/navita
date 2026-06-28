import type { Adapter } from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { vi } from "vitest";
import { style } from "../../src";

describe("style", () => {
  it("delegates the rule to the adapter addCss and returns its class name", () => {
    const addCss = vi.fn().mockReturnValue("navita-abc");
    setAdapter({ addCss } as unknown as Adapter);

    const rule = { color: "red", ":hover": { color: "blue" } };
    const result = style(rule);

    expect(addCss).toHaveBeenCalledTimes(1);
    expect(addCss).toHaveBeenCalledWith(rule);
    expect(result).toBe("navita-abc");
  });

  it("passes the rule through untouched (no cloning/normalising)", () => {
    const addCss = vi.fn().mockReturnValue("x");
    setAdapter({ addCss } as unknown as Adapter);

    const rule = { padding: 0 };
    style(rule);

    // Same reference is forwarded to the adapter.
    expect(addCss.mock.calls[0][0]).toBe(rule);
  });
});
