import * as fs from "fs";
import type { Renderer, ImportMap, EngineOptions } from "@navita/core/createRenderer";
import { createRenderer } from "@navita/core/createRenderer";
import { importMap as defaultImportMap } from "@navita/css";
import type { Plugin, ViteDevServer } from "vite";

/*
Some information for anyone wondering why we have duplicate css for the initial load
during development in remix.
https://github.com/remix-run/remix/discussions/8070#discussioncomment-7625870
*/

let renderer: Renderer;

const VIRTUAL_MODULE_ID = 'virtual:navita.css';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

interface Options {
  importMap?: ImportMap;
  engineOptions?: EngineOptions;
}

export function navita(options?: Options) {
  const importMap = [...defaultImportMap, ...(options?.importMap || [])];

  let server: ViteDevServer;
  let lastCssContent: string | undefined;
  let context: string;
  let isSSR = false;
  let isDEV = true;

  return {
    enforce: "pre",
    name: "navita",
    config(_, env) {
      isDEV = env.command === 'serve';

      return {
        optimizeDeps: {
          include: isDEV ? ['@navita/css'] : [],
        },
        ssr: {
          external: [
            '@navita/css',
            '@navita/adapter',
          ],
        },
      }
    },
    configResolved(config) {
      context = config.root;
      isSSR = !!config.build.ssr;
    },
    configureServer(_server) {
      lastCssContent = undefined;
      server = _server;
    },
    async buildStart() {
      if (renderer) {
        return;
      }

      const defaultEngineOptions = {
        enableSourceMaps: isDEV,
        enableDebugIdentifiers: isDEV,
        ...(options?.engineOptions || {}),
      };

      renderer = createRenderer({
        context,
        importMap,
        engineOptions: defaultEngineOptions,
        resolver: async (filepath: string, request: string) => {
          const resolved = await this.resolve(request, filepath);
          return resolved?.id || null;
        },
        readFile: (path: string) => {
          return fs.promises.readFile(path, 'utf-8');
        },
      });
    },
    resolveId(source) {
      if (source === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    async load(source) {
      if (source === RESOLVED_VIRTUAL_MODULE_ID) {
        return renderer.engine.renderCssToString();
      }

      return;
    },
    async transform(code, id) {
      // Bail as early as we can
      if (!importMap.map((x) => x.source).some((value) => code.indexOf(value) !== -1)) {
        renderer.clearCache(id);
        return null;
      }

      const { result, sourceMap, dependencies } = await renderer.transformAndProcess({
        content: code,
        filePath: id,
      });

      const newCssContent = renderer.engine.renderCssToString();

      if (lastCssContent !== newCssContent) {
        invalidateModule(RESOLVED_VIRTUAL_MODULE_ID);
        lastCssContent = newCssContent;

        for (const file of dependencies) {
          if (!file.includes('node_modules')) {
            this.addWatchFile(file);
          }

          invalidateModule(file);
        }
      }

      return {
        code: `${result}\nimport "${VIRTUAL_MODULE_ID}";`,
        map: sourceMap,
      };
    },
    renderChunk(_, chunk) {
      if (isSSR) {
        return;
      }

      for (const id of Object.keys(chunk.modules)) {
        if (id.startsWith(RESOLVED_VIRTUAL_MODULE_ID)) {
          delete chunk.modules[id];
        }
      }

      chunk.viteMetadata.importedCss.add(
        this.getFileName(
          this.emitFile({
            name: "navita.css",
            type: "asset",
            source: renderer.engine.renderCssToString()
          })
        )
      );
    }
  } as Plugin;

  function invalidateModule(absoluteId: string) {
    if (!server) {
      return;
    }

    const { moduleGraph } = server;
    const modules = moduleGraph.getModulesByFile(absoluteId);

    if (modules) {
      for (const module of modules) {
        moduleGraph.invalidateModule(module);

        // Vite uses this timestamp to add `?t=` query string automatically for HMR.
        module.lastHMRTimestamp =
          module.lastInvalidationTimestamp || Date.now();
      }
    }
  }
}
