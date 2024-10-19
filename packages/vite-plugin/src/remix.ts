import fs from 'fs';
import type { Renderer } from '@navita/core/createRenderer';
import { createRenderer } from '@navita/core/createRenderer';
import { importMap } from '@navita/css';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

export function navita(): Plugin {
  let server: ViteDevServer;
  let config: ResolvedConfig;

  return {
    enforce: 'pre',
    name: 'navita',
    configResolved(_resolvedConfig) {
      config = _resolvedConfig;
    },
    configureServer(_server) {
      server = _server;
    },
    async buildStart() {
      if (getRenderer()) {
        return;
      }

      const build = await server.ssrLoadModule(
        'virtual:remix/server-build',
      );
      const {module} = build.routes.root;

      build.routes.root.module = {
        ...module,
        links: () => [
          ...module.links(),
          {rel: 'stylesheet', href: '@navita.css'},
        ],
      };

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

      if (id === '/@navita.css') {
        return '/@navita/vite-plugin';
      }
    },
    async load(id) {
      if (id === '/@navita/vite-plugin') {
        const css = getRenderer()?.engine.renderCssToString() || '';

        return {
          code: css,
          map: {mappings: ''},
        };
      }
    },
    async transform(code, id) {
      const renderer = getRenderer();

      if (!renderer) {
        return null;
      }

      if (
        !importMap.map((x) => x.source).some((value) => code.indexOf(value) !== -1)
      ) {
        renderer.clearCache(id);
        return null;
      }

      if (id.includes('node_modules')) {
        return null;
      }

      const {result} = await renderer.transformAndProcess({
        content: code,
        filePath: id,
      });

      if (config.command === 'build' && !config.build.watch) {
        console.log('Building, so that is nice');
      }

      // Todo: only in build.
      updateNavitaCSS();

      return result;
    },
    renderChunk(_, chunk) {
      const isSSR = config.build.ssr;

      if (!isSSR) {
        // We only want to add shit to this.
        // We would probably do this in writeBundle?
        console.log('chunk', chunk);
        /*
        chunk.viteMetadata?.importedCss.add(
          `assets/true-alexanders-coola-fil.css`,
        );
        return;

         */
      }

      // When we're in the server bundle, we can finally emit our CSS.
      const referenceId = this.emitFile({
        fileName: `assets/${isSSR}-alexanders-coola-fil.css`,
        name: 'navita.css',
        type: 'asset',
        source: getRenderer()?.engine.renderCssToString(),
      });

      const filename = this.getFileName(referenceId);
      console.log({referenceId, filename});

      if (chunk.viteMetadata) {
        chunk.viteMetadata.importedCss.add(filename);
      }
    },
    transformIndexHtml: {
      handler: async () => {
        return [
          {
            tag: "link",
            injectTo: "head",
            attrs: {
              rel: "stylesheet",
              href: '@navita.css',
            },
          },
        ];
      },
    }
  };

  function updateNavitaCSS() {
    // Todo: we should defer this a tiny bit?

    if (!server) {
      return;
    }

    const { moduleGraph, ws } = server;

    const mod = moduleGraph.getModuleById('/@navita/vite-plugin');

    if (mod) {
      moduleGraph.invalidateModule(mod);

      ws.send({
        type: 'update',
        updates: [
          {
            type: 'css-update',
            path: '/@navita.css',
            acceptedPath: '/@navita.css',
            timestamp: Date.now(),
          },
        ],
      });
    }
  }
}

const globalNavitaRendererKey = '__navita_renderer';

function setRenderer(renderer: Renderer) {
  globalThis[globalNavitaRendererKey] = renderer;
}

function getRenderer(): Renderer | undefined {
  return globalThis[globalNavitaRendererKey];
}
