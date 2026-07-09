import path from "node:path";
import type { Engine } from "@navita/engine";
import { extraction } from "@navita/extraction";
import type { ImportMap } from "@navita/types";
import { createCompiledFunction } from "./helpers/createCompiledFunction";
import type {
  NodeModuleCache,
  ResolverCache,
} from "./helpers/createDefineFunction";
import { createDefineFunction } from "./helpers/createDefineFunction";
import type { ResultCache } from "./helpers/setAdapter";
import { setAdapter } from "./helpers/setAdapter";

const rootDir = path.resolve(__dirname, "../../");

/**
 * A dependency is "external" when navita imports it as an opaque module (native
 * `import()`, exports used as-is) instead of recursively evaluating its source
 * to extract navita styles from it. By default that's navita's own packages
 * (`rootDir`) and everything under `node_modules`.
 *
 * `transformNodeModules` carves specific `node_modules` paths back OUT of that
 * set — a component library authored WITH navita ships un-compiled `style()`/
 * theme calls in files that DO need recursive evaluation (and dependency
 * tracking for HMR). navita's own packages stay external regardless, so a broad
 * matcher can never make navita try to evaluate `@navita/css` itself.
 */
export type NodeModuleMatcher = string | RegExp;

const matches = (matchers: NodeModuleMatcher[], dependency: string) =>
  matchers.some((matcher) =>
    matcher instanceof RegExp
      ? matcher.test(dependency)
      : dependency.includes(matcher),
  );

const createIsExternal =
  (transformNodeModules: NodeModuleMatcher[]) => (dependency: string) =>
    dependency.startsWith(rootDir) ||
    (dependency.includes("node_modules") &&
      !matches(transformNodeModules, dependency));

type FilePathWithType = string;
type ModuleCache = Map<
  FilePathWithType,
  {
    source: string;
    compiledFn: () => Promise<{
      dependencies: string[];
      exports: Record<string, unknown>;
    }>;
  }
>;

export interface Caches {
  nodeModuleCache?: NodeModuleCache;
  resolverCache?: ResolverCache;
  moduleCache?: ModuleCache;
  resultCache?: ResultCache;
}

const defaultNodeModuleCache: NodeModuleCache = {};
const defaultResolverCache: ResolverCache = {};
const defaultModuleCache: ModuleCache = new Map();
const defaultResultCache: ResultCache = {};

type Types = "entryPoint" | "dependency";

interface Output<Type extends Types> {
  result: Type extends "entryPoint"
    ? ResultCache[number]
    : Record<string, unknown>;
  dependencies: string[];
}

export async function evaluateAndProcess<
  Type extends "entryPoint" | "dependency",
>({
  type,
  filePath,
  source,
  engine,
  resolver,
  readFile,
  importMap,
  transformNodeModules = [],
  nodeModuleCache = defaultNodeModuleCache,
  resolverCache = defaultResolverCache,
  moduleCache = defaultModuleCache,
  resultCache = defaultResultCache,
}: {
  source: string;
  filePath: string;
  type: Type;
  engine: Engine;
  resolver: (filePath: string, request: string) => Promise<string>;
  readFile: (filePath: string) => Promise<string>;
  importMap: ImportMap;
  transformNodeModules?: NodeModuleMatcher[];
} & Caches): Promise<Output<Type>> {
  const cacheKey = `${filePath}:${type}`;
  const isExternal = createIsExternal(transformNodeModules);

  const compiledFn = await (async () => {
    if (moduleCache.has(cacheKey)) {
      const cache = moduleCache.get(cacheKey);
      if (cache.source === source) {
        return cache.compiledFn;
      }
    }

    const newSource = await extraction(source, {
      filename: filePath,
      entryPoint: type === "entryPoint",
      importMap,
    });

    const define = createDefineFunction(
      {
        filePath,
        resolver,
        isExternal,
        resolverCache,
        nodeModuleCache,
        setAdapter: () =>
          setAdapter({
            engine,
            resultCache: resultCache,
          }),
      },
      (dependency) =>
        readFile(dependency)
          .then((source) =>
            evaluateAndProcess({
              type: "dependency",
              source: source.toString(),
              filePath: dependency,
              engine,
              resolver,
              readFile,
              importMap,
              transformNodeModules,
              nodeModuleCache,
              resolverCache,
              moduleCache,
            }),
          )
          .then(({ result }) => result),
    );

    const compiledFn = createCompiledFunction(`return ${newSource}`, define);

    moduleCache.set(cacheKey, {
      source,
      compiledFn,
    });

    return compiledFn;
  })();

  return compiledFn().then(({ dependencies, exports }) => {
    if (type === "entryPoint") {
      return {
        result: resultCache[filePath] || [],
        dependencies,
      };
    }

    return {
      result: exports,
      dependencies,
    };
  }) as Promise<Output<Type>>;
}
