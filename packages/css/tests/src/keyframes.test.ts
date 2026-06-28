import type { Adapter } from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import { vi } from "vitest";
import { keyframes } from "../../src";

describe("keyframes", () => {
  it("delegates the keyframes rule to addKeyframe and returns the animation name", () => {
    const addKeyframe = vi.fn().mockReturnValue("navita-kf");
    setAdapter({ addKeyframe } as unknown as Adapter);

    const rule = { from: { opacity: 0 }, to: { opacity: 1 } };
    const result = keyframes(rule);

    expect(addKeyframe).toHaveBeenCalledTimes(1);
    expect(addKeyframe).toHaveBeenCalledWith(rule);
    expect(result).toBe("navita-kf");
  });
});
