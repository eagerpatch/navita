import * as fs from "fs";
import type { Renderer, ImportMap, EngineOptions } from "@navita/core/createRenderer";
import { createRenderer } from "@navita/core/createRenderer";
import { importMap as defaultImportMap } from "@navita/css";
import type { Plugin, ViteDevServer } from "vite";

let renderer: Renderer;

/*
Some information for anyone wondering why we have duplicate css for the initial load
during development in remix.
https://github.com/remix-run/remix/discussions/8070#discussioncomment-7625870
*/

const VIRTUAL_CSS_NAME = '\0virtual:navita.css';

interface Options {
  importMap?: ImportMap;
  engineOptions?: EngineOptions;
}

export function navita(options?: Options) {
  const importMap = [...defaultImportMap, ...(options?.importMap || [])];

  let server: ViteDevServer;
  let lastCssContent: string | undefined;
  let context: string;

  return {
    name: "navita",
    enforce: "pre",
    config() {
      return {
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
    },
    configureServer(_server) {
      lastCssContent = undefined;
      server = _server;
    },
    async buildStart() {
      const defaultEngineOptions = {
        enableSourceMaps: !!server,
        enableDebugIdentifiers: !!server,
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
    async resolveId(id) {
      if (id === VIRTUAL_CSS_NAME) {
        return VIRTUAL_CSS_NAME;
      }

      return;
    },
    async load(id) {
      if (id === VIRTUAL_CSS_NAME) {
        return lastCssContent;
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
        invalidateModule(VIRTUAL_CSS_NAME);
        this.addWatchFile(VIRTUAL_CSS_NAME);

        lastCssContent = newCssContent;

        for (const file of dependencies) {
          if (!file.includes('node_modules')) {
            this.addWatchFile(file);
          }

          invalidateModule(file);
        }
      }

      return {
        code: `${result} import "${VIRTUAL_CSS_NAME}";`,
        map: sourceMap,
      };
    },
    renderChunk(_, chunk) {
      for (const id of Object.keys(chunk.modules)) {
        if (id.startsWith(VIRTUAL_CSS_NAME)) {
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
