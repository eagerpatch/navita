import { vi } from "vitest";
import { getNavitaDependency } from "../../src/getNavitaDependency";

const makeWebpack = () => {
  class Dependency {
    serialize() {}
    deserialize() {}
  }

  const register = vi.fn();

  return {
    Dependency,
    util: { serialization: { register } },
    register,
  };
};

describe("getNavitaDependency", () => {
  it("caches the generated class per webpack instance", () => {
    const webpack = makeWebpack();

    const First = getNavitaDependency(webpack as never);
    const Second = getNavitaDependency(webpack as never);

    expect(First).toBe(Second);
    expect(getNavitaDependency(makeWebpack() as never)).not.toBe(First);
  });

  it("registers the class for serialization", () => {
    const webpack = makeWebpack();

    const NavitaDependency = getNavitaDependency(webpack as never);

    expect(webpack.register).toHaveBeenCalledWith(
      NavitaDependency,
      expect.stringContaining("NavitaDependency"),
      null,
      expect.objectContaining({
        serialize: expect.any(Function),
        deserialize: expect.any(Function),
      }),
    );
  });

  it("builds instances that look like a css module dependency", () => {
    const NavitaDependency = getNavitaDependency(makeWebpack() as never);

    const instance = new NavitaDependency("/src/a.ts", "abc123");

    expect(instance.issuerPath).toBe("/src/a.ts");
    expect(instance.cssHash).toBe("abc123");
    expect(instance.request).toBe(".css");
    expect(instance.getResourceIdentifier()).toBe(
      "css-module-/src/a.ts-abc123",
    );
    expect(
      instance.getModuleEvaluationSideEffectsState({
        TRANSITIVE_ONLY: "transitive-only",
      } as never),
    ).toBe("transitive-only");
  });
});
