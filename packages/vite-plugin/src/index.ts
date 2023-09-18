import * as fs from "fs";
import type { Renderer, ImportMap, EngineOptions } from "@navita/core/createRenderer";
import { createRenderer } from "@navita/core/createRenderer";
import { importMap as defaultImportMap } from "@navita/css";
import type { Plugin, ViteDevServer } from "vite";

const VIRTUAL_MODULE_NAME = 'virtual:navita';
const VIRTUAL_CSS_NAME = 'virtual:navita.css';

interface Options {
  importMap?: ImportMap;
  engineOptions?: EngineOptions;
}

export function navita(options?: Options) {
  let renderer: Renderer;
  const importMap = [...defaultImportMap, ...(options?.importMap || [])];

  let server: ViteDevServer;
  let lastCssContent: string | undefined;

  return {
    name: "navita",
    enforce: "pre",
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
    async resolveId(source) {
      if (source === VIRTUAL_MODULE_NAME) {
        return VIRTUAL_CSS_NAME;
      }

      return null;
    },
    async load(id) {
      if (id === VIRTUAL_CSS_NAME) {
        return lastCssContent;
      }
      return null;
    },
    async transform(code, id) {
      // Bail as early as we can
      if (!importMap.map((x) => x.source).some((value) => code.indexOf(value) !== -1)) {
        return null;
      }

      const { result } = await renderer.transformAndProcess({
        content: code,
        filePath: id,
      });

      const newCssContent = renderer.engine.renderCssToString();

      if (lastCssContent !== newCssContent) {
        if (server) {
          const { moduleGraph } = server;
          const virtualModule = moduleGraph.getModuleById(VIRTUAL_CSS_NAME);
          if (virtualModule) {
            moduleGraph.invalidateModule(virtualModule);
            virtualModule.lastHMRTimestamp = Date.now();
          }
        }

        lastCssContent = newCssContent;
      }

      return `
        ${result}
        import "${VIRTUAL_MODULE_NAME}";
      `;
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
}
