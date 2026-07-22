import fs from "node:fs";
import type {
  EngineOptions,
  ImportMap,
  Renderer,
} from "@navita/core/createRenderer";
import { createRenderer } from "@navita/core/createRenderer";
import { importMap as defaultImportMap } from "@navita/css";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

export const VIRTUAL_MODULE_ID = "virtual:navita.css";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID.replace(/.css$/, "")}`;

export interface Options {
  importMap?: ImportMap;
  engineOptions?: EngineOptions;
  /**
   * By default the transform skips every file under `node_modules`, since most
   * dependencies ship plain CSS or no navita styles at all. A component library
   * authored WITH navita, however, ships un-compiled `style()` calls that must
   * still be transformed — otherwise they throw "Could not find an adapter" at
   * runtime.
   *
   * Provide matchers here for the `node_modules` paths that should be treated
   * as navita source. Each matcher is a substring (matched with
   * `id.includes(...)`) or a `RegExp` tested against the module id. A matched
   * path is both transformed AND recursively evaluated, so the library's own
   * cross-file imports (a theme/tokens file it ships) resolve correctly instead
   * of being imported as an opaque module. navita's own packages (`@navita/*`)
   * stay external regardless.
   *
   * @example
   * navita({ transformNodeModules: ["@acme/ui", /@acme\/.*\/navita\//] })
   */
  transformNodeModules?: (string | RegExp)[];
}

export function navita(options?: Options): Plugin {
  const importMap = [...defaultImportMap, ...(options?.importMap || [])];
  const transformNodeModules = options?.transformNodeModules || [];
  const isForcedNodeModule = (id: string) =>
    transformNodeModules.some((matcher) =>
      matcher instanceof RegExp ? matcher.test(id) : id.includes(matcher),
    );
  let server: ViteDevServer;
  let config: ResolvedConfig;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let cssEmitted = false;
  let isProduction = false;
  // The renderer is created once in buildStart, but its resolver closure must
  // not capture that hook's plugin context: under rolldown (Vite 8) calling
  // this.resolve on a stale context fails, which silently drops alias-based
  // imports (e.g. "@/lib/theme") down to the enhanced-resolve fallback that
  // doesn't know the bundler's aliases. Track the most recent live context
  // instead — transform refreshes it before any style evaluation runs.
  let resolveCtx: {
    resolve(
      source: string,
      importer?: string,
    ): Promise<{ id: string } | null>;
  };

  const plugin: Plugin = {
    enforce: "pre",
    name: "navita",
    configResolved(_resolvedConfig) {
      config = _resolvedConfig;
      isProduction = config.mode === "production";
    },
    configureServer(_server) {
      server = _server;
    },
    buildStart() {
      resolveCtx = this;

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
          transformNodeModules,
          resolver: async (filepath: string, request: string) => {
            const resolved = await resolveCtx.resolve(request, filepath);
            return resolved?.id || null;
          },
          readFile: (path: string) => {
            return fs.promises.readFile(path, "utf-8");
          },
        }),
      );
    },
    resolveId(source) {
      const [id] = source.split("?");

      if (id.endsWith(VIRTUAL_MODULE_ID)) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    async load(source) {
      const [id] = source.split("?");

      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const css = getRenderer()?.engine.renderCssToString() || "";

        return {
          code: css,
          map: { mappings: "" },
        };
      }
    },
    async transform(code, id) {
      resolveCtx = this;

      const renderer = getRenderer();

      // During RedwoodSDK's worker "linker" pass, Vite re-feeds the already-built
      // worker bundle back through the plugin pipeline. Its navita styles were
      // already extracted in the first pass, and the bundle imports runtime-only
      // specifiers (node:*, cloudflare:*, virtual:*) that navita can neither
      // resolve nor evaluate at build time. Skip it — the navitaRwsdk renderChunk
      // hook handles CSS-path rewriting in this pass (same RWSDK_BUILD_PASS gate).
      if (
        !renderer ||
        (id.includes("node_modules") && !isForcedNodeModule(id)) ||
        process.env.RWSDK_BUILD_PASS === "linker"
      ) {
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

      const { result, sourceMap, dependencies } =
        await renderer.transformAndProcess({
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
    renderChunk(_, chunk) {
      // CSS is a client asset, so emit it once in the client environment.
      // Gating on the environment (rather than a global "first chunk wins"
      // latch) is what keeps this correct under rwsdk: its first rendered pass
      // is an empty throwaway worker build, and a bare latch would be consumed
      // there — leaving the real client build unstyled. The renderer is a
      // global singleton that has accumulated every prior pass (ssr runs before
      // client), so server-only components are covered too.
      if (this.environment?.name !== "client" || cssEmitted) {
        return;
      }

      const css = getRenderer()?.engine.renderCssToString();

      // Nothing compiled yet (e.g. an early empty pass): leave the latch unset
      // so a later, populated client chunk still emits.
      if (!css) {
        return;
      }

      chunk.viteMetadata.importedCss.add(
        this.getFileName(
          this.emitFile({
            name: "navita.css",
            type: "asset",
            source: css,
          }),
        ),
      );

      cssEmitted = true;
    },
  };

  return plugin;

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
      }

      // Send the css-update even when the virtual module isn't in the graph.
      // Under rwsdk the stylesheet is served by a middleware, so it never
      // enters the module graph — gating the notification on `mod` would drop
      // every style HMR. In a normal Vite app `mod` exists once the page has
      // loaded, so this is unchanged there.
      ws.send({
        type: "update",
        updates: [
          {
            type: "css-update",
            path: `/${VIRTUAL_MODULE_ID}`,
            acceptedPath: `/${VIRTUAL_MODULE_ID}`,
            timestamp: Date.now(),
          },
        ],
      });
    }, 20);
  }
}

const globalNavitaRendererKey = "__navita_renderer";

function setRenderer(renderer: Renderer) {
  globalThis[globalNavitaRendererKey] = renderer;
}

export function getRenderer(): Renderer | undefined {
  return globalThis[globalNavitaRendererKey];
}
