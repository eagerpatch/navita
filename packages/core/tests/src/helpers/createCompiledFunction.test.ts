import { vi } from "vitest";
import { createCompiledFunction } from "../../../src/helpers/createCompiledFunction";

/**
 * Light coverage for the vm sandbox: `define` wiring, the magicProxy
 * window/document/navigator browser stubs, and the standard globals copied into
 * the sandbox context.
 */
describe("createCompiledFunction", () => {
  it("wires the provided define function and returns its value", () => {
    const define = vi.fn(
      (_deps: string[], factory: (...args: any[]) => void) => {
        factory();
        return "compiled-result";
      },
    );

    const run = createCompiledFunction(
      'return define(["a", "b"], function () {})',
      define,
    );

    expect(run()).toBe("compiled-result");
    expect(define).toHaveBeenCalledTimes(1);
    expect(define).toHaveBeenCalledWith(["a", "b"], expect.any(Function));
  });

  it("stubs browser globals (window/document/navigator) with recursive magic proxies", () => {
    const define = vi.fn(
      (_deps: string[], factory: (...args: any[]) => void) => {
        factory();
        return "ok";
      },
    );

    // Deeply accessing browser APIs inside the sandbox must not throw — the
    // magic proxy returns another proxy for every property access.
    const run = createCompiledFunction(
      [
        "return define([], function () {",
        "  window.location.href.length;",
        "  document.body.style.color;",
        "  navigator.userAgent.length;",
        "});",
      ].join("\n"),
      define,
    );

    expect(() => run()).not.toThrow();
    expect(define).toHaveBeenCalledTimes(1);
  });

  it("exposes standard JS globals inside the sandbox context", () => {
    const run = createCompiledFunction<string>(
      "return JSON.stringify({ ok: true, n: Math.max(1, 2) })",
      (() => undefined) as never,
    );

    expect(run()).toBe('{"ok":true,"n":2}');
  });
});
