import { createHash as nodeCreateHash } from "node:crypto";
import { type Mock, vi } from "vitest";
import type { LoaderContext } from "webpack";
import loader from "../../src/loader";

// A fake NavitaDependency constructor so we can assert what the loader builds
// without dragging in the real webpack Dependency machinery.
class FakeNavitaDependency {
  constructor(
    public readonly issuerPath: string,
    public readonly cssHash: string,
  ) {}
}

// `createHashFunction` reads `compilation.compiler.webpack.util.createHash`
// plus the output hash options. Back it with node's crypto.
const fakeCompilation = {
  compiler: {
    webpack: {
      util: { createHash: (algorithm: string) => nodeCreateHash(algorithm) },
    },
  },
  outputOptions: {
    hashFunction: "sha256",
    hashDigest: "hex",
    hashDigestLength: 16,
  },
};

const RESOURCE_PATH = "/src/component.ts";
const INPUT_SOURCE_MAP = "// input source map";
const OUTPUT_SOURCE_MAP = { output: true };

describe("loader success path", () => {
  let callback: Mock;
  let addDependency: Mock;
  let moduleAddDependency: Mock;
  let transformAndProcess: Mock;

  beforeEach(() => {
    callback = vi.fn();
    addDependency = vi.fn();
    moduleAddDependency = vi.fn();
    transformAndProcess = vi.fn().mockResolvedValue({
      result: "TRANSFORMED",
      dependencies: ["/dep/a.ts", "/dep/b.ts"],
      usedIds: { rule: ["x"] },
      sourceMap: OUTPUT_SOURCE_MAP,
    });
  });

  const createContext = (
    options: { outputCss?: boolean; hot?: boolean } = {},
  ) =>
    ({
      async: () => callback,
      addDependency,
      resourcePath: RESOURCE_PATH,
      hot: options.hot ?? false,
      getOptions: () => ({
        importMap: [{ source: "@navita/css", callee: "style" }],
        renderer: { clearCache: vi.fn(), transformAndProcess },
        NavitaDependency: FakeNavitaDependency,
        outputCss: options.outputCss ?? false,
      }),
      _module: { matchResource: "", addDependency: moduleAddDependency },
      _compilation: fakeCompilation,
      _compiler: {
        webpack: { RuntimeGlobals: { require: "__webpack_require__" } },
      },
    }) as unknown as LoaderContext<unknown>;

  const input = `import { style } from '@navita/css';\nstyle({ color: 'red' });`;

  it("transforms, adds dependencies, and returns the OUTPUT source map", async () => {
    await loader.call(
      createContext({ outputCss: false }),
      input,
      INPUT_SOURCE_MAP,
    );

    // Locks C1: the callback receives the transform's output source map,
    // not the loader's incoming `sourceMap` param.
    expect(callback).toHaveBeenCalledWith(
      null,
      "TRANSFORMED",
      OUTPUT_SOURCE_MAP,
    );
    expect(transformAndProcess).toHaveBeenCalledWith({
      content: input,
      filePath: RESOURCE_PATH,
    });

    // Each returned dependency is registered as a file dependency.
    expect(addDependency).toHaveBeenCalledTimes(2);
    expect(addDependency).toHaveBeenNthCalledWith(1, "/dep/a.ts");
    expect(addDependency).toHaveBeenNthCalledWith(2, "/dep/b.ts");

    // Without outputCss there is no NavitaDependency.
    expect(moduleAddDependency).not.toHaveBeenCalled();
  });

  it("adds a NavitaDependency when outputCss is enabled", async () => {
    await loader.call(
      createContext({ outputCss: true }),
      input,
      INPUT_SOURCE_MAP,
    );

    expect(moduleAddDependency).toHaveBeenCalledTimes(1);
    const dependency = moduleAddDependency.mock.calls[0][0];
    expect(dependency).toBeInstanceOf(FakeNavitaDependency);
    expect(dependency.issuerPath).toBe(RESOURCE_PATH);
    expect(typeof dependency.cssHash).toBe("string");
    expect(dependency.cssHash).toHaveLength(16);

    // No HMR snippet when `hot` is off.
    const emitted = callback.mock.calls[0][1] as string;
    expect(emitted).toBe("TRANSFORMED");
  });

  it("injects the HMR runtime snippet when hot is enabled", async () => {
    await loader.call(
      createContext({ outputCss: true, hot: true }),
      input,
      INPUT_SOURCE_MAP,
    );

    const emitted = callback.mock.calls[0][1] as string;
    expect(emitted).toContain("TRANSFORMED");
    expect(emitted).toContain("__webpack_require__.navitaDevHash");
    expect(emitted).toContain("hmr/css");
    expect(emitted).toContain("css()");
  });
});
