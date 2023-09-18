import fs from "fs";
import path from "path";
import enhancedResolve from "enhanced-resolve";

const { ResolverFactory, CachedInputFileSystem } = enhancedResolve;

const resolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: [".js", ".cjs", ".mjs"],
  conditionNames: ["import", "require"]
});

const requireResolveLike = (request: string, paths: string[] = []) => Promise.any(paths.map((path) => new Promise<string>((resolve, reject) => {
  resolver.resolve({}, path, request, {}, (err, result) => {
    if (err || !result) {
      return reject(err);
    }

    resolve(result);
  });
})));

const importWithRequireResolution = async (request: string, startPath: string = __dirname) => {
  return import(await requireResolveLike(request, [startPath]) || request);
};

type FilePath = string;
export type ResolverCache = Record<FilePath, unknown>;
export type NodeModuleCache = Record<FilePath, unknown>;

interface Params {
  filePath: string;
  resolver: (filePath: string, request: string) => Promise<string>;
  isExternal: (dependency: string) => boolean;
  resolverCache: ResolverCache;
  nodeModuleCache: NodeModuleCache;
  setAdapter: () => void;
}

export function createDefineFunction({
  filePath,
  resolver,
  isExternal,
  resolverCache,
  nodeModuleCache,
  setAdapter
}: Params, resolveDependency: (dependency: string) => Promise<Record<string, unknown>>) {
  const filepathDirectory = path.dirname(filePath);

  return async function define(dependencies: string[], factoryFn: (...args) => void) {
    const exports: Record<string, unknown> = {};

    const dependencyMap = {
      require: importWithRequireResolution,
      exports
    };

    const resolvedDependencies: string[] = await Promise.all(
      dependencies
        .filter((dependency) => !(dependency in dependencyMap))
        .map((dependency) => {
          if (!resolverCache[filepathDirectory]) {
            resolverCache[filepathDirectory] = {};
          }

          if (resolverCache[filepathDirectory][dependency]) {
            return resolverCache[filepathDirectory][dependency];
          }

          const resolved = resolver(filePath, dependency)
            .catch(() => undefined)
            .then((resolvedDependency) => {
              if (!resolvedDependency || isExternal(resolvedDependency)) {
                return requireResolveLike(dependency, [filepathDirectory, __dirname]).catch(() => {
                  throw new Error(`Failed to resolve dependency "${dependency}" in ${filePath}`);
                });
              }

              return resolvedDependency;
            });

          resolverCache[filepathDirectory][dependency] = resolved;
          return resolved;
        })
    ).catch((error: Error) => {
      throw error;
    });

    for (const dependency of resolvedDependencies) {
      if (nodeModuleCache[dependency]) {
        dependencyMap[dependency] = nodeModuleCache[dependency];
        continue;
      }

      /**
       * Ignore everything that's not:
       * .js, .ts, .jsx, .tsx, .mts, .mjs, .cjs, .cts
       */
      if (/\.(?![mc]?[tj]sx?$)[^.]+$/.test(dependency)) {
        dependencyMap[dependency] = {};
        continue;
      }

      if (isExternal(dependency)) {
        const module = importWithRequireResolution(dependency, filepathDirectory);

        if (!nodeModuleCache[dependency]) {
          nodeModuleCache[dependency] = module;
        }

        dependencyMap[dependency] = nodeModuleCache[dependency];
        continue;
      }

      dependencyMap[dependency] = resolveDependency(dependency);
    }

    const dependencyValues = await Promise.all(Object.values(dependencyMap));

    // The adapter needs to be set before factoryFn is called.
    setAdapter();
    factoryFn(...dependencyValues);

    return {
      dependencies: resolvedDependencies.filter((x) => !isExternal(x)),
      exports
    };
  };
}
