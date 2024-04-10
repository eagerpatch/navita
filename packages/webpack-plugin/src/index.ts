import path from "path";
import type { Renderer, ImportMap, Engine, EngineOptions } from "@navita/core/createRenderer";
import { createRenderer } from "@navita/core/createRenderer";
import { importMap as defaultImportMap } from "@navita/css";
import type { Compiler, RuleSetRule, Compilation, Chunk } from "webpack";
import type { ConcatSource } from "webpack-sources";
import { createHashFunction } from "./createHashFunction";
import type { NavitaDependencyInstance } from "./getNavitaDependency";
import { getNavitaDependency } from "./getNavitaDependency";
import type { NavitaModuleInstance } from "./getNavitaModule";
import { getNavitaModule, NAVITA_MODULE_TYPE } from "./getNavitaModule";
import type { CSSOutput, UsedIdCache } from "./prepareCssOutput";
import { prepareCssOutput } from "./prepareCssOutput";

export { getNavitaDependency, getNavitaModule, NAVITA_MODULE_TYPE };
export { CSSOutput, Engine, Compilation, UsedIdCache };
export type { Renderer };

type MiniCSSExtractPlugin = {
  options: {
    filename: string;
    chunkFilename: string;
  }
};

export interface Options {
  outputCss?: boolean;
  exclude?: NonNullable<RuleSetRule["exclude"]>;
  importMap?: ImportMap;
  optimizeCSSOutput?: (output: CSSOutput, compilation?: Compilation, engine?: Engine) => CSSOutput;
  engineOptions?: EngineOptions;
  onRenderInitialized?: (renderer: Renderer) => Promise<void>;
  /**
   * This uses webpacks cache to store the engine state between builds.
   * If you have more than one webpack instance running at the same time,
   * you should disable this option, and instead do something similar to
   * what is done in the `next-plugin` package.
   */
  useWebpackCache?: boolean;
}

const defaultOptions: Options = {
  outputCss: true,
  useWebpackCache: true,
  exclude: /node_modules/,
  importMap: [],
};

let renderer: Renderer;
const cacheKey = "navita";
const MINI_CSS_EXTRACT_MODULE_TYPE = "css/mini-extract";

export class NavitaPlugin {
  static pluginName = "NavitaPlugin";
  options: Options;

  constructor(options?: Options) {
    this.options = {
      ...defaultOptions,
      ...(options || {})
    };
  }

  apply(compiler: Compiler) {
    const { webpack } = compiler;

    const NavitaDependency = getNavitaDependency(compiler.webpack);
    const NavitaModule = getNavitaModule(compiler.webpack);

    const {
      exclude,
      importMap: userImportMap,
      outputCss,
      optimizeCSSOutput,
      engineOptions,
      useWebpackCache,
      onRenderInitialized,
    } = this.options;

    const importMap = [
      ...defaultImportMap,
      ...(userImportMap || [])
    ];

    const dev = compiler.options.mode !== "production";

    const defaultEngineOptions = {
      enableSourceMaps: dev,
      enableDebugIdentifiers: dev,
      ...(engineOptions || {}),
    };

    compiler.hooks.make.tapPromise(NavitaPlugin.pluginName, async (compilation) => {
      if (renderer) {
        return;
      }

      const resolverFactory = compilation.resolverFactory.get("normal", {});
      const fileSystem = compiler.inputFileSystem;

      renderer = createRenderer({
        context: compiler.options.context,
        engineOptions: defaultEngineOptions,
        importMap,
        async resolver(filepath: string, request: string) {
          return new Promise<string>((resolve, reject) => {
            resolverFactory.resolve({}, path.dirname(filepath), request, {}, (error, result) => {
              if (error || !result) {
                return reject(error);
              }

              return resolve(result);
            });
          })
        },
        async readFile(filepath: string) {
          return new Promise<string>((resolve, reject) => {
            fileSystem.readFile(filepath, (error, result) => {
              if (error || !result) {
                return reject(error);
              }

              resolve(result.toString());
            });
          });
        }
      });

      if (onRenderInitialized) {
        await onRenderInitialized(renderer);
      }

      if (!useWebpackCache) {
        return;
      }

      const cacheName = `${NavitaPlugin.pluginName}-${compiler.options.mode}`;

      const result = await compilation
        .getCache(cacheName)
        .getPromise<Buffer>(NavitaPlugin.pluginName, cacheKey);

      if (result) {
        await renderer.engine.deserialize(result);
      }

      compiler.hooks.afterEmit.tapPromise(NavitaPlugin.pluginName, async (compilation) => {
        await compilation
          .getCache(cacheName)
          .storePromise(NavitaPlugin.pluginName, cacheKey, Buffer.from(renderer.engine.serialize()));
      });
    });

    compiler.options.module?.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude,
      loader: require.resolve("@navita/webpack-plugin/loader"),
      options: {
        importMap,
        get renderer() {
          return renderer;
        },
        NavitaDependency,
        outputCss,
      }
    });

    // Add the NavitaDependency and NavitaModule to the compilation
    compiler.hooks.compilation.tap(NavitaPlugin.pluginName, (compilation) => {
      compilation.dependencyFactories.set(
        NavitaDependency,
        {
          create(data, callback) {
            const { dependencies: [dependency] } = data;
            const { issuerPath, cssHash } = dependency as NavitaDependencyInstance;

            callback(undefined, {
              module: new NavitaModule(issuerPath, cssHash),
              cacheable: true,
            });
          }
        }
      );

      compilation.dependencyTemplates.set(NavitaDependency, { apply: () => undefined });
    });

    if (dev) {
      compiler.options.optimization.splitChunks = {
        ...(compiler.options.optimization.splitChunks || {}),
        cacheGroups: {
          ...(compiler.options.optimization.splitChunks['cacheGroups'] || {}),
          navita: {
            chunks: 'all',
            enforce: true,
            name: 'navita',
            type: NAVITA_MODULE_TYPE,
          }
        }
      };
    }

    const miniCssExtractPlugin = compiler.options.plugins.find(
      (plugin) => 'getCssModule' in plugin.constructor && 'getCssDependency' in plugin.constructor
    ) as unknown as MiniCSSExtractPlugin;

    if (!miniCssExtractPlugin) {
      // We require MiniCssExtractPlugin to exist to actually output the CSS,
      // even though we're not using it for the actual CSS extraction.
      // But we need its runtime.
      return;
    }

    const { filename, chunkFilename } = miniCssExtractPlugin.options || {};

    const { options: { getCacheGroups: checkCacheGroup } } = new compiler.webpack.optimize.SplitChunksPlugin(
      compiler.options.optimization?.splitChunks || undefined
    );

    compiler.hooks.compilation.tap(NavitaPlugin.pluginName, (compilation) => {
      const hashFn = createHashFunction(compilation);
      let devHash: string | undefined;

      const cssResult = new Map<Chunk, {
        css: string;
        hash: string;
        modules: NavitaModuleInstance[];
      }>();

      compilation.hooks.afterOptimizeChunkIds.tap(NavitaPlugin.pluginName, () => {
        let output = prepareCssOutput({
          compilation,
          engine: renderer.engine,
          checkCacheGroup,
        });

        if (dev) {
          const css = renderer.engine.renderCssToString();
          devHash = hashFn(css);

          for (const chunk of output.keys()) {
            cssResult.set(chunk, {
              css,
              hash: devHash,
              modules: [],
            });
          }

          return;
        }

        if (output.size > 0 && optimizeCSSOutput) {
          output = optimizeCSSOutput(output, compilation, renderer.engine);
        }

        for (const [chunk, value] of output) {
          const { modules, usedIds, filePaths, canUseOpinionatedLayers } = value;

          const css = renderer.engine.renderCssToString({
            filePaths,
            usedIds,
            opinionatedLayers: canUseOpinionatedLayers,
          });

          cssResult.set(chunk, {
            css,
            hash: hashFn(css),
            modules,
          });
        }
      });

      compilation.hooks.renderManifest.tap(NavitaPlugin.pluginName, (result, { chunk }) => {
        if (chunk instanceof webpack.HotUpdateChunk) {
          return;
        }

        if (!cssResult.has(chunk)) {
          return;
        }

        const { css, hash } = cssResult.get(chunk)!;

        if (!css) {
          return;
        }

        if (!dev) {
          const entry = result.find(
            (x) => (
              'pathOptions' in x &&
              x.pathOptions.contentHashType === MINI_CSS_EXTRACT_MODULE_TYPE &&
              x.pathOptions.chunk === chunk
            )
          );

          if (entry) {
            const miniCssContentPluginRender = entry.render;

            entry.render = () => {
              const source = miniCssContentPluginRender() as ConcatSource;
              source.add(css);
              return source;
            };

            entry.hash = chunk.contentHash[MINI_CSS_EXTRACT_MODULE_TYPE];

            return result;
          }
        }

        result.push({
          render: () => new webpack.sources.RawSource(css),
          filenameTemplate: chunk.canBeInitial() ? filename : chunkFilename,
          pathOptions: {
            chunk,
            contentHashType: MINI_CSS_EXTRACT_MODULE_TYPE
          },
          identifier: `navita.${chunk.id}`,
          hash: hash,
        });

        chunk.contentHash[MINI_CSS_EXTRACT_MODULE_TYPE] = hash;

        return result;
      });

      if (dev) {
        // We're using a RuntimeModule instead of DefinePlugin, because
        // using DefinePlugin with runtimeValues creates a dependency to
        // the runtimeValue, and will cause all modules that uses it to be rebuilt.
        // This approach seems to work better for our use case.
        // Maybe we'll try to properly integrate with webpacks HMR in the future.
        const { RuntimeGlobals, RuntimeModule } = compiler.webpack;

        compilation.hooks.runtimeRequirementInTree
          .for(RuntimeGlobals.ensureChunkHandlers)
          .tap(NavitaPlugin.pluginName, (chunk) => {
            compilation.addRuntimeModule(
              chunk,
              new class extends RuntimeModule {
                generate() {
                  return `${RuntimeGlobals.require}.navitaDevHash = () => "${devHash}"`;
                }
              }(NavitaPlugin.pluginName, RuntimeModule.STAGE_NORMAL)
            );
          });

        // We don't need to continue with the rest of the hooks in development.
        // We have our own HMR, and we don't use dynamic imports for the css.
        return;
      }

      const fakeMiniCSSExtractModules: NavitaModuleInstance[] = [];

      compilation.hooks.additionalTreeRuntimeRequirements.tap(NavitaPlugin.pluginName, (mainChunk) => {
        for (const chunk of mainChunk.getAllAsyncChunks()) {
          if (!cssResult.has(chunk)) {
            continue;
          }

          const { modules } = cssResult.get(chunk)!;

          for (const module of modules) {
            // We set this to trick MiniCssExtractPlugin to include NavitaModules
            // in its runtime.
            module.type = MINI_CSS_EXTRACT_MODULE_TYPE;
          }

          fakeMiniCSSExtractModules.push(...modules);
        }
      });

      compilation.hooks.beforeChunkAssets.tap(NavitaPlugin.pluginName, () => {
        for (const module of fakeMiniCSSExtractModules) {
          // And then we set it back to the original value
          module.type = NAVITA_MODULE_TYPE;
        }
      });

      compilation.hooks.contentHash.tap(NavitaPlugin.pluginName, (chunk) => {
        if (!cssResult.has(chunk)) {
          return;
        }

        const { hash: navitaHash } = cssResult.get(chunk)!;
        const miniCssHash = chunk.contentHash[MINI_CSS_EXTRACT_MODULE_TYPE];
        chunk.contentHash[MINI_CSS_EXTRACT_MODULE_TYPE] = (
          miniCssHash ? hashFn(miniCssHash, navitaHash) : navitaHash
        );
        chunk.contentHash[NAVITA_MODULE_TYPE] = navitaHash;
      });
    });
  }
}
