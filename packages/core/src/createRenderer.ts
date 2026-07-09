import type { Options as EngineOptions, UsedIdCache } from "@navita/engine";
import { Engine } from "@navita/engine";
import type { ImportMap } from "@navita/types";
import MagicString from "magic-string";
import type { Caches, NodeModuleMatcher } from "./evaluateAndProcess";
import { evaluateAndProcess } from "./evaluateAndProcess";
import type { ResultCache } from "./helpers/setAdapter";

export type {
  Engine,
  EngineOptions,
  ImportMap,
  NodeModuleMatcher,
  UsedIdCache,
};

export interface Options {
  resolver: (filepath: string, request: string) => Promise<string>;
  readFile: (filepath: string) => Promise<string>;
  importMap: ImportMap;
  engineOptions?: EngineOptions;
  context?: string;
  /**
   * `node_modules` paths that should be recursively evaluated instead of
   * imported as opaque modules — a library authored WITH navita. Each matcher
   * is a substring (`id.includes(...)`) or a `RegExp` tested against the id.
   */
  transformNodeModules?: NodeModuleMatcher[];
}

export function createRenderer({
  resolver,
  readFile,
  importMap = [],
  engineOptions,
  context,
  transformNodeModules = [],
}: Options) {
  const engine = new Engine({
    context,
    ...(engineOptions || {}),
  });

  // Caches are scoped to the renderer instance. They MUST NOT be shared across
  // renderers: a cached compiled module closes over the engine/resultCache of
  // whichever renderer first compiled it, so reusing it from another renderer
  // would write to the wrong engine (cross-renderer leakage). See createRenderer
  // tests for the isolation guarantee.
  const resultCache: ResultCache = {};
  const moduleCache: NonNullable<Caches["moduleCache"]> = new Map();
  const nodeModuleCache: NonNullable<Caches["nodeModuleCache"]> = {};
  const resolverCache: NonNullable<Caches["resolverCache"]> = {};

  const clearCache = (filePath: string) => {
    engine.clearCache(filePath);
    resultCache[filePath] = [];
  };

  return {
    engine,
    clearCache,
    async transformAndProcess({
      content,
      filePath,
    }: {
      content: string;
      filePath: string;
    }) {
      clearCache(filePath);

      const { result, dependencies } = await evaluateAndProcess({
        type: "entryPoint",
        source: content,
        filePath,
        resolver,
        readFile,
        importMap,
        transformNodeModules,
        engine,
        resultCache,
        moduleCache,
        nodeModuleCache,
        resolverCache,
      });

      const newSource = new MagicString(content, {
        filename: filePath,
      });

      for (const { start, end, value } of result.reverse()) {
        newSource.update(start, end, value);
      }

      return {
        result: newSource.toString(),
        dependencies,
        usedIds: engine.getCacheIds([filePath]),
        sourceMap: newSource.generateMap(),
      };
    },
  };
}

export type Renderer = ReturnType<typeof createRenderer>;
