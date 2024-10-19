import fs from 'fs';
import type { EngineOptions, ImportMap, Renderer } from "@navita/core/createRenderer";
import { createRenderer } from '@navita/core/createRenderer';
import { importMap as defaultImportMap } from "@navita/css";
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

export const VIRTUAL_MODULE_ID = 'virtual:navita.css';
const RESOLVED_VIRTUAL_MODULE_ID =
  '\0' + VIRTUAL_MODULE_ID.replace(/.css$/, '');

export interface Options {
  importMap?: ImportMap;
  engineOptions?: EngineOptions;
}

export function navita(options?: Options): Plugin {
  const importMap = [...defaultImportMap, ...(options?.importMap || [])];
  let server: ViteDevServer;
  let config: ResolvedConfig;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let cssEmitted = false;
  let isProduction = false;

  return {
    enforce: 'pre',
    name: 'navita',
    configResolved(_resolvedConfig) {
      config = _resolvedConfig;
      isProduction = config.mode === 'production';
    },
    configureServer(_server) {
      server = _server;
    },
    buildStart() {
      if (getRenderer()) {
        return;
      }

      setRenderer(
        createRenderer({
          context: config.root,
          engineOptions: {
            enableSourceMaps: !isProduction,
            enableDebugIdentifiers: !isProduction,
            ...(options?.engineOptions || {}),
          },
          importMap,
          resolver: async (filepath: string, request: string) => {
            const resolved = await this.resolve(request, filepath);
            return resolved?.id || null;
          },
          readFile: (path: string) => {
            return fs.promises.readFile(path, 'utf-8');
          },
        }),
      );
    },
    resolveId(source) {
      const [id] = source.split('?');

      if (id.endsWith(VIRTUAL_MODULE_ID)) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    async load(source) {
      const [id] = source.split('?');

      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const css = getRenderer()?.engine.renderCssToString() || '';

        return {
          code: css,
          map: { mappings: '' },
        };
      }
    },
    async transform(code, id) {
      const renderer = getRenderer();

      if (!renderer || id.includes('node_modules')) {
        return null;
      }

      if (
        !importMap
          .map((x) => x.source)
          .some((value) => code.indexOf(value) !== -1)
      ) {
        renderer.clearCache(id);
        return null;
      }

      const { result, sourceMap, dependencies } = await renderer.transformAndProcess({
        content: code,
        filePath: id,
      });

      if (!isProduction) {
        for (const dependency of dependencies) {
          this.addWatchFile(dependency);
        }

        updateNavitaCSS();
      }

      return {
        code: result,
        map: sourceMap,
      };
    },
    transformIndexHtml: {
      handler: async () => {
        // If we're building, we don't want to inject the CSS into the HTML.
        // We'll do this in the `renderChunk` hook instead.
        if (isProduction) {
          return [];
        }

        return [
          {
            tag: 'link',
            injectTo: 'head',
            attrs: {
              rel: 'stylesheet',
              href: `/${VIRTUAL_MODULE_ID}`,
            },
          },
        ];
      },
    },
    renderChunk(_, chunk) {
      if (cssEmitted) {
        return;
      }

      chunk.viteMetadata.importedCss.add(
        this.getFileName(
          this.emitFile({
            name: 'navita.css',
            type: 'asset',
            source: getRenderer()?.engine.renderCssToString(),
          })
        )
      );

      cssEmitted = true;
    }
  };

  function updateNavitaCSS() {
    if (!server) {
      return;
    }

    clearTimeout(updateTimer!);

    updateTimer = setTimeout(() => {
      const { moduleGraph, ws } = server;
      const mod = moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);

      if (mod) {
        moduleGraph.invalidateModule(mod);

        ws.send({
          type: 'update',
          updates: [
            {
              type: 'css-update',
              path: `/${VIRTUAL_MODULE_ID}`,
              acceptedPath: `/${VIRTUAL_MODULE_ID}`,
              timestamp: Date.now(),
            },
          ],
        });
      }
    }, 20);
  }
}

const globalNavitaRendererKey = '__navita_renderer';

function setRenderer(renderer: Renderer) {
  globalThis[globalNavitaRendererKey] = renderer;
}

export function getRenderer(): Renderer | undefined {
  return globalThis[globalNavitaRendererKey];
}
