import { Engine } from "@navita/engine";
import type { UsedIdCache, Options as EngineOptions } from "@navita/engine";
import { transformer } from "@navita/swc";
import type { ImportMap } from "@navita/types";
export type { ImportMap };
import { evaluateAndProcess } from "./evaluateAndProcess";
import { startsWithRSCDirective } from "./helpers/startsWithRSCDirective";

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
      const [newContent, { result, dependencies }] = await Promise.all([
        transformer(content, {
          filename: filePath,
          importMap,
        }),
        evaluateAndProcess({
          type: 'entryPoint',
          source: content,
          filePath,
          resolver,
          readFile,
          importMap,
          engine,
        }),
      ]);

      const finalContent: string[] = [];

      // Check if content starts with "use client".
      if (startsWithRSCDirective(content)) {
        const [directive, ...restContent] = newContent.trim().split('\n');

        finalContent.push(directive, result, ...restContent);
      } else {
        finalContent.push(result, newContent.trim());
      }

      return {
        result: finalContent.join('\n'),
        dependencies,
        usedIds: engine.getUsedCacheIds([filePath]),
      };
    }
  };
}

export type Renderer = ReturnType<typeof createRenderer>;
