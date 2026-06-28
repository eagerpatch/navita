import { vi } from "vitest";
import { getNavitaModule, NAVITA_MODULE_TYPE } from "../../src/getNavitaModule";

// A fresh fake `webpack` per call so the module-level cache (keyed by the
// webpack object) never collides between tests.
const makeWebpack = () => {
  class Module {
    type: string;
    buildInfo: unknown;
    constructor(type: string) {
      this.type = type;
    }
    serialize() {}
    deserialize() {}
  }

  const register = vi.fn();

  return {
    Module,
    util: { serialization: { register } },
    register,
  };
};

describe("getNavitaModule", () => {
  it("caches the generated class per webpack instance", () => {
    const webpack = makeWebpack();

    const First = getNavitaModule(webpack as never);
    const Second = getNavitaModule(webpack as never);

    expect(First).toBe(Second);

    const other = makeWebpack();
    expect(getNavitaModule(other as never)).not.toBe(First);
  });

  it("registers the class for serialization", () => {
    const webpack = makeWebpack();

    const NavitaModule = getNavitaModule(webpack as never);

    expect(webpack.register).toHaveBeenCalledWith(
      NavitaModule,
      expect.stringContaining("NavitaModule"),
      null,
      expect.objectContaining({
        serialize: expect.any(Function),
        deserialize: expect.any(Function),
      }),
    );
  });

  it("builds instances with the expected identity and metadata", () => {
    const NavitaModule = getNavitaModule(makeWebpack() as never);

    const instance = new NavitaModule("/src/a.ts", "abc123");

    expect(instance.issuerPath).toBe("/src/a.ts");
    expect(instance.cssHash).toBe("abc123");
    expect(instance.type).toBe(NAVITA_MODULE_TYPE);
    expect(instance.buildInfo).toEqual({ cacheable: true, hash: "abc123" });
    expect(instance.identifier()).toBe("css/navita|/src/a.ts|abc123");
    expect(
      instance.readableIdentifier({ shorten: (path: string) => `~${path}` }),
    ).toBe("navita ~/src/a.ts abc123");
    expect(instance.size()).toBe(0);

    const needBuildCallback = vi.fn();
    instance.needBuild(null, needBuildCallback);
    expect(needBuildCallback).toHaveBeenCalledWith(null, false);
  });

  it("applies objectToAssign for next.js css-matching", () => {
    const NavitaModule = getNavitaModule(
      makeWebpack() as never,
      ({ issuerPath, cssHash }) => ({
        resource: `${issuerPath}#${cssHash}`,
      }),
    );

    const instance = new NavitaModule("/src/b.ts", "hash") as never as {
      resource: string;
    };

    expect(instance.resource).toBe("/src/b.ts#hash");
  });
});
