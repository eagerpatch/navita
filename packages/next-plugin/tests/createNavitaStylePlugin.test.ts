import * as fs from "node:fs";
import * as os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import type { Configuration } from "webpack";
import { createNavitaStylePlugin } from "../src/index";

// `createNavitaStylePlugin`'s webpack hook calls next's `findPagesDir`, which
// throws unless an `app` or `pages` directory exists. Create a throwaway one.
let projectDir: string;

beforeAll(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "navita-next-"));
  fs.mkdirSync(path.join(projectDir, "app"));
});

afterAll(() => {
  fs.rmSync(projectDir, { recursive: true, force: true });
});

const makeConfig = (cache: Configuration["cache"]): Configuration =>
  ({
    plugins: [],
    module: { rules: [] },
    optimization: {},
    cache,
    mode: "development",
  }) as Configuration;

const runWebpack = (
  nextConfigInput: Record<string, unknown>,
  cache: Configuration["cache"],
) => {
  const enhanced = createNavitaStylePlugin()(nextConfigInput as never);
  const config = makeConfig(cache);
  // biome-ignore lint/suspicious/noExplicitAny: next's webpack hook signature.
  const result = (enhanced as any).webpack(config, {
    dir: projectDir,
    dev: true,
    isServer: false,
    nextRuntime: undefined,
  });
  return { config, result };
};

describe("createNavitaStylePlugin", () => {
  it("returns a config enhancer with a webpack function", () => {
    const enhanced = createNavitaStylePlugin()({} as never);
    expect(typeof (enhanced as { webpack?: unknown }).webpack).toBe("function");
  });

  // Locks C3: a non-filesystem webpack cache leaves `cacheDirectory` undefined.
  // The old code called `path.resolve(undefined, 'data.txt')`, which threw a
  // TypeError during Next config evaluation.
  it("does not throw when the webpack cache is not filesystem-based", () => {
    expect(() => runWebpack({}, { type: "memory" } as never)).not.toThrow();
  });

  it("does not throw when the webpack cache is disabled (boolean)", () => {
    expect(() => runWebpack({}, true)).not.toThrow();
  });

  it("does not throw with a filesystem cache", () => {
    expect(() =>
      runWebpack({}, {
        type: "filesystem",
        cacheDirectory: path.join(projectDir, ".cache"),
      } as never),
    ).not.toThrow();
  });

  it("wires the fromServerLoader rule and the NavitaPlugin", () => {
    const { config, result } = runWebpack({}, { type: "memory" } as never);

    // fromServerLoader rule is unshifted to the front of the module rules.
    const firstRule = config.module?.rules?.[0] as { loader?: string };
    expect(firstRule.loader).toContain("fromServerLoader");

    // The NavitaPlugin is added to the plugin list.
    expect(
      config.plugins?.some(
        (plugin) => plugin?.constructor?.name === "NavitaPlugin",
      ),
    ).toBe(true);

    // With no user webpack function, the (mutated) config is returned as-is.
    expect(result).toBe(config);
  });

  it("chains an existing nextConfig.webpack", () => {
    const userWebpack = vi.fn((config: Configuration) =>
      Object.assign({ chained: true }, config),
    );

    const { result } = runWebpack({ webpack: userWebpack }, {
      type: "memory",
    } as never);

    expect(userWebpack).toHaveBeenCalledTimes(1);
    expect((result as { chained?: boolean }).chained).toBe(true);
  });
});
