import path from "path";
import type { Engine } from "@navita/engine";
import { extraction } from "@navita/swc";
import type { ImportMap } from "@navita/types";
import { createCompiledFunction } from "./helpers/createCompiledFunction";
import type { NodeModuleCache, ResolverCache } from "./helpers/createDefineFunction";
import { createDefineFunction } from "./helpers/createDefineFunction";
import type { CollectedResults } from "./helpers/setAdapter";
import { setAdapter } from "./helpers/setAdapter";

const rootDir = path.resolve(__dirname, "../../");
const isExternal = (dependency: string) => dependency.startsWith(rootDir) || dependency.includes('node_modules');

type FilePathWithType = string;
type ModuleCache = Map<FilePathWithType, {
  source: string;
  compiledFn: () => Promise<{
    dependencies: string[];
    exports: Record<string, unknown>;
  }>;
}>;

export interface Caches {
  nodeModuleCache?: NodeModuleCache;
  resolverCache?: ResolverCache;
  moduleCache?: ModuleCache;
}

const defaultNodeModuleCache: NodeModuleCache = {};
const defaultResolverCache: ResolverCache = {};
const defaultModuleCache: ModuleCache = new Map();
const collectedResults: CollectedResults = {};

type Types = 'entryPoint' | 'dependency';

interface Output<Type extends Types> {
  result: Type extends 'entryPoint' ? CollectedResults[number] : Record<string, unknown>;
  dependencies: string[];
}

export async function evaluateAndProcess<Type extends 'entryPoint' | 'dependency'>({
  type,
  filePath,
  source,
  engine,
  resolver,
  readFile,
  importMap,
  nodeModuleCache = defaultNodeModuleCache,
  resolverCache = defaultResolverCache,
  moduleCache = defaultModuleCache,
}: {
  source: string;
  filePath: string;
  type: Type;
  engine: Engine;
  resolver: (filePath: string, request: string) => Promise<string>;
  readFile: (filePath: string) => Promise<string>;
  importMap: ImportMap;
} & Caches): Promise<Output<Type>> {
  const cacheKey = `${filePath}:${type}`;

  const compiledFn = await (async () => {
    if (moduleCache.has(cacheKey)) {
      const cache = moduleCache.get(cacheKey);
      if (cache.source === source) {
        return cache.compiledFn;
      }
    }

    const newSource = await extraction(source, {
      filename: filePath,
      entryPoint: type === 'entryPoint',
      importMap,
    });

    const define = createDefineFunction({
      filePath,
      resolver,
      isExternal,
      resolverCache,
      nodeModuleCache,
      setAdapter: () => setAdapter({
        engine,
        collectResults: collectedResults,
      })
    }, (dependency) => (
      readFile(dependency)
        .then(
          (source) => evaluateAndProcess({
            type: 'dependency',
            source: source.toString(),
            filePath: dependency,
            engine,
            resolver,
            readFile,
            importMap,
            nodeModuleCache,
            resolverCache,
            moduleCache,
          }))
        .then(({ result }) => result)
    ));

    const compiledFn = createCompiledFunction(
      `return ${newSource}`,
      define,
    );

    moduleCache.set(cacheKey, {
      source,
      compiledFn,
    });

    return compiledFn;
  })();

  return compiledFn().then(({ dependencies, exports }) => {
    if (type === 'entryPoint') {
      return {
        result: collectedResults[filePath],
        dependencies,
      };
    }

    return {
      result: exports,
      dependencies,
    }
  }) as Promise<Output<Type>>;
}
