import type { Adapter } from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { vi } from "vitest";
import { globalStyle } from "../../src";

describe("globalStyle", () => {
  it("delegates the selector and rule to the adapter addStaticCss", () => {
    const addStaticCss = vi.fn();
    setAdapter({ addStaticCss } as unknown as Adapter);

    const rule = { margin: 0, boxSizing: "border-box" };
    globalStyle("body", rule);

    expect(addStaticCss).toHaveBeenCalledTimes(1);
    expect(addStaticCss).toHaveBeenCalledWith("body", rule);
  });

  it("returns void even when the adapter returns a value", () => {
    const addStaticCss = vi.fn().mockReturnValue("ignored-static-instance");
    setAdapter({ addStaticCss } as unknown as Adapter);

    expect(globalStyle("html", { color: "red" })).toBeUndefined();
  });
});
