import { Engine } from "@navita/engine";
import type { UsedIdCache, Options as EngineOptions } from "@navita/engine";
import type { ImportMap } from "@navita/types";
export type { ImportMap };
import MagicString from "magic-string";
import { evaluateAndProcess } from "./evaluateAndProcess";

export type { Engine, UsedIdCache, EngineOptions };

export interface Options {
  resolver: (filepath: string, request: string) => Promise<string>;
  readFile: (filepath: string) => Promise<string>;
  importMap: ImportMap;
  engineOptions?: EngineOptions;
}

export function createRenderer({
  resolver,
  readFile,
  importMap = [],
  engineOptions,
}: Options) {
  const engine = new Engine(engineOptions);

  return {
    engine,
    async transformAndProcess({
      content,
      filePath,
    }: {
      content: string;
      filePath: string;
    }) {
      const { result, dependencies } = await evaluateAndProcess({
        type: 'entryPoint',
        source: content,
        filePath,
        resolver,
        readFile,
        importMap,
        engine,
      });

      const newSource = new MagicString(content, {
        filename: filePath,
      });

      for (const { start, end, value } of result.reverse()) {
        const newValue = value === undefined ? 'undefined' : JSON.stringify(value);
        newSource.update(start, end, newValue);
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
