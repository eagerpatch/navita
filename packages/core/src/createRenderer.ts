import { Engine } from "@navita/engine";
import type { UsedIdCache, Options as EngineOptions } from "@navita/engine";
import type { ImportMap } from "@navita/types";
import MagicString from "magic-string";
import { evaluateAndProcess } from "./evaluateAndProcess";
import type { ResultCache } from "./helpers/setAdapter";

export type { Engine, UsedIdCache, EngineOptions };
export type { ImportMap };

export interface Options {
  resolver: (filepath: string, request: string) => Promise<string>;
  readFile: (filepath: string) => Promise<string>;
  importMap: ImportMap;
  engineOptions?: EngineOptions;
  context?: string;
}

const resultCache: ResultCache = {};

export function createRenderer({
  resolver,
  readFile,
  importMap = [],
  engineOptions,
  context,
}: Options) {
  const engine = new Engine({
    context,
    ...(engineOptions || {}),
  });

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
        type: 'entryPoint',
        source: content,
        filePath,
        resolver,
        readFile,
        importMap,
        engine,
        resultCache
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
        usedIds: engine.getUsedCacheIds([filePath]),
        sourceMap: newSource.generateMap(),
      };
    }
  };
}

export type Renderer = ReturnType<typeof createRenderer>;
