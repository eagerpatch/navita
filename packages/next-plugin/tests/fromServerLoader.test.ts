import { vi } from "vitest";
import type { LoaderContext } from "webpack";
import { pitch } from "../src/fromServerLoader";

// `getNavitaDependency` (imported from the built @navita/webpack-plugin) builds
// its class from `this._compiler.webpack.Dependency`, so a minimal fake suffices.
const makeWebpack = () => {
  class Dependency {
    serialize() {}
    deserialize() {}
  }
  return {
    Dependency,
    util: { serialization: { register: vi.fn() } },
  };
};

describe("fromServerLoader.pitch", () => {
  it("clears loaders, adds the dependency, and sets the layer", () => {
    const addDependency = vi.fn();
    const _module = {
      loaders: ["some-loader"],
      layer: undefined as string | undefined,
      addDependency,
    };

    const context = {
      _module,
      _compiler: { webpack: makeWebpack() },
      resourceQuery: "?cssHash=hash123&issuerPath=%2Fsrc%2Fcomponent.ts",
    } as unknown as LoaderContext<unknown>;

    const result = pitch.call(context);

    // Returns an empty module body.
    expect(result).toBe("");

    // Loaders are stripped and the layer is set to keep the module out of the
    // app-pages browser manifest.
    expect(_module.loaders).toEqual([]);
    expect(_module.layer).toBe("not-app-pages-browser");

    // A NavitaDependency built from the parsed resource query is registered.
    expect(addDependency).toHaveBeenCalledTimes(1);
    const dependency = addDependency.mock.calls[0][0];
    expect(dependency.cssHash).toBe("hash123");
    expect(dependency.issuerPath).toBe("/src/component.ts");
  });
});
