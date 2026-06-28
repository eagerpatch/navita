import { AsyncSeriesHook, SyncHook } from "tapable";
import { vi } from "vitest";
import type { Compiler } from "webpack";
import { NavitaPlugin } from "../../src/index";

describe("NavitaPlugin", () => {
  describe("options", () => {
    it("applies sensible defaults", () => {
      const plugin = new NavitaPlugin();

      expect(NavitaPlugin.pluginName).toBe("NavitaPlugin");
      expect(plugin.options.outputCss).toBe(true);
      expect(plugin.options.useWebpackCache).toBe(true);
      expect(plugin.options.exclude).toEqual(/node_modules/);
      expect(plugin.options.importMap).toEqual([]);
    });

    it("lets the caller override defaults", () => {
      const plugin = new NavitaPlugin({
        outputCss: false,
        useWebpackCache: false,
      });

      expect(plugin.options.outputCss).toBe(false);
      expect(plugin.options.useWebpackCache).toBe(false);
    });
  });

  describe("apply", () => {
    // A fake compiler that exercises the synchronous wiring done by `apply`,
    // up to (and excluding) the MiniCssExtractPlugin-dependent code path.
    const makeCompiler = (mode = "development") => {
      class Dependency {
        serialize() {}
        deserialize() {}
      }
      class Module {
        type: string;
        constructor(type: string) {
          this.type = type;
        }
        serialize() {}
        deserialize() {}
      }

      const webpack = {
        Dependency,
        Module,
        util: { serialization: { register: vi.fn() } },
      };

      return {
        webpack,
        options: {
          mode,
          context: "/project",
          module: { rules: [] as unknown[] },
          // Real webpack always provides a splitChunks object; mirror that so the
          // dev cache-group spread doesn't read from `undefined`.
          optimization: { splitChunks: { cacheGroups: {} } },
          plugins: [], // no MiniCssExtractPlugin -> apply returns early
        },
        hooks: {
          make: new AsyncSeriesHook(["compilation"]),
          compilation: new SyncHook(["compilation"]),
        },
        inputFileSystem: {},
      };
    };

    it("registers the navita loader rule", () => {
      const compiler = makeCompiler();

      new NavitaPlugin().apply(compiler as unknown as Compiler);

      const rules = compiler.options.module.rules as Array<{
        loader?: string;
        options?: {
          outputCss?: boolean;
          importMap?: Array<{ source: string }>;
          NavitaDependency?: unknown;
        };
      }>;

      const rule = rules.find(
        (entry) =>
          typeof entry.loader === "string" && entry.loader.includes("loader"),
      );

      expect(rule).toBeDefined();
      expect(rule!.options?.outputCss).toBe(true);
      expect(
        rule!.options?.importMap?.some(
          (entry) => entry.source === "@navita/css",
        ),
      ).toBe(true);
      expect(rule!.options?.NavitaDependency).toBeDefined();
    });

    it("adds the navita splitChunks cache group in development", () => {
      const compiler = makeCompiler("development");

      new NavitaPlugin().apply(compiler as unknown as Compiler);

      const cacheGroups = (
        compiler.options.optimization.splitChunks as {
          cacheGroups: Record<string, unknown>;
        }
      ).cacheGroups;

      expect(cacheGroups.navita).toMatchObject({
        chunks: "all",
        enforce: true,
        name: "navita",
      });
    });
  });
});
