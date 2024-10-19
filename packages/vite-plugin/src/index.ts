import fs from 'fs';
import type { Renderer } from '@navita/core/createRenderer';
import { createRenderer } from '@navita/core/createRenderer';
import { importMap } from '@navita/css';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

export const VIRTUAL_MODULE_ID = 'virtual:navita.css';
const RESOLVED_VIRTUAL_MODULE_ID =
  '\0' + VIRTUAL_MODULE_ID.replace(/.css$/, '');

export function navita(): Plugin {
  let server: ViteDevServer;
  let config: ResolvedConfig;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    enforce: 'pre',
    name: 'navita',
    configResolved(_resolvedConfig) {
      config = _resolvedConfig;
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

      const { result } = await renderer.transformAndProcess({
        content: code,
        filePath: id,
      });

      if (!(config.command === 'build' && !config.build.watch)) {
        updateNavitaCSS();
      }

      return result;
    },
    transformIndexHtml: {
      handler: async () => {
        return [
          {
            tag: "link",
            injectTo: "head",
            attrs: {
              rel: "stylesheet",
              href: `/${VIRTUAL_MODULE_ID}`,
            },
          },
        ];
      },
    },
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
