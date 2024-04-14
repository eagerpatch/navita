import * as fs from "fs";
import path from "node:path";
import type { Options, Renderer } from "@navita/webpack-plugin";
import { getNavitaModule, NavitaPlugin, NAVITA_MODULE_TYPE } from "@navita/webpack-plugin";
import type MiniCssExtractPluginType from "mini-css-extract-plugin";
import type { NextConfig } from "next";
import NextMiniCssExtractPluginDefault from 'next/dist/build/webpack/plugins/mini-css-extract-plugin';

export type { Renderer };
import { findPagesDir } from "next/dist/lib/find-pages-dir";
import type { Configuration } from "webpack";
import { optimizeCSSOutput } from "./optimizeCSSOutput";

let renderer: Renderer;
let lastCache: string;

const MiniCssExtractPlugin = NextMiniCssExtractPluginDefault['default'] as typeof MiniCssExtractPluginType;

interface Config extends Omit<Options, 'useWebpackCache'> {
  singleCssFile?: boolean;
}

export const createNavitaStylePlugin = (navitaConfig: Config = {}) =>
  (nextConfig: NextConfig) =>
    Object.assign(
      {},
      nextConfig,
      {
        webpack(config: Configuration, options) {
          const { dir, dev } = options;

          config.plugins?.push(
            {
              apply(compiler) {
                // We call the getNavitaModule function here
                // so that NavitaModule is created with what's required for the next.js rsc to client entry promotion:
                getNavitaModule(compiler.webpack, ({ cssHash, issuerPath }) => ({
                  // The resourceResolveData is used by next.js to promote server and ssr entries to client entries:
                  // https://github.com/vercel/next.js/blob/f3132354285fb18c290bf9aad7f8dc7e0550105d/packages/next/src/build/webpack/plugins/flight-client-entry-plugin.ts#L590
                  resourceResolveData: {
                    path: '',
                    query: '?' + new URLSearchParams({
                      cssHash,
                      issuerPath,
                    }).toString(),
                  },

                  // We set the resource to ".css"
                  // to trick next.js into thinking this is a css module:
                  // https://github.com/vercel/next.js/blob/f3132354285fb18c290bf9aad7f8dc7e0550105d/packages/next/src/build/webpack/loaders/utils.ts#L24
                  resource: '.css',
                }));
              }
            }
          );

          // This loader promotes the server and ssr entries to client entries:
          config.module?.rules.unshift({
            resourceQuery: [
              /cssHash/,
              /issuerPath/,
            ],
            loader: require.resolve("@navita/next-plugin/fromServerLoader"),
          });

          const findPagesDirResult = findPagesDir(dir);
          const hasAppDir = !!(findPagesDirResult && findPagesDirResult.appDir);
          const isServer = options.isServer && !(options.nextRuntime === 'edge')
          const outputCss = !isServer || hasAppDir;

          if (!hasAppDir && !isServer) {
            const filename = dev
              ? 'static/css/[name].css'
              : 'static/css/[contenthash].css';

            // https://github.com/vercel/next.js/blob/930db5c1afbe541a0b2357c26123c2b365b56624/packages/next/src/build/webpack/config/blocks/css/index.ts#L595
            config.plugins.push(
              new MiniCssExtractPlugin({
                filename,
                chunkFilename: filename,
                ignoreOrder: true,
              }),
            );
          }

          if (navitaConfig?.singleCssFile) {
            config.optimization.splitChunks = {
              ...(config.optimization.splitChunks || {}),
              cacheGroups: {
                ...(config.optimization.splitChunks['cacheGroups'] || {}),
                navita: {
                  chunks: 'all',
                  enforce: true,
                  name: 'navita',
                  type: NAVITA_MODULE_TYPE,
                }
              }
            };
          }

          // Next.js creates at least three webpack instances. We can't rely on the webpack cache.
          const { cache, mode } = config;

          const cacheDirectory = (
            typeof cache !== "boolean" && cache.type === "filesystem" ?
              path.resolve(cache.cacheDirectory, `navita-${mode}`) :
              undefined
          );

          const cacheDestination = path.resolve(cacheDirectory, 'data.txt');

          const onRenderInitialized = async (createdRenderer: Renderer) => {
            renderer = createdRenderer;

            try {
              // Ensure the cache directory exists:
              await fs.promises.mkdir(cacheDirectory, { recursive: true });

              const content = await fs.promises.readFile(cacheDestination, 'utf-8');

              await renderer.engine.deserialize(content);

              lastCache = renderer.engine.serialize();
            } catch {
              // This will happen if the user doesn't have write access to the cache directory.
              // But the same should happen with the webpack cache.
            }

            // If the user has provided their own onRenderInitialized function,
            // we'll do it after the cache is loaded.
            return navitaConfig.onRenderInitialized?.(renderer);
          };

          config.plugins?.push({
            apply(compiler) {
              compiler.hooks.afterEmit.tapPromise(`${NavitaPlugin.pluginName}-nextjs-custom-cache`, async () => {
                if (!renderer) {
                  return;
                }

                const newCache = renderer.engine.serialize();

                if (newCache === lastCache) {
                  return;
                }

                lastCache = newCache;

                await fs.promises.writeFile(cacheDestination, newCache);
              });
            }
          });

          config.plugins?.push(
            new NavitaPlugin({
              useWebpackCache: false,
              outputCss,
              ...navitaConfig,
              onRenderInitialized,
              optimizeCSSOutput,
            })
          );

          if (typeof nextConfig.webpack === "function") {
            return nextConfig.webpack(config, options);
          }

          return config;
        }
      } as NextConfig,
    );
