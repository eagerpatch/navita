import type { Engine, UsedIdCache } from "@navita/core/createRenderer";
import type { Chunk, Compilation, ChunkGraph, ModuleGraph, Module } from "webpack";
import type { NavitaModuleInstance } from "./getNavitaModule";
import { getNavitaModule } from "./getNavitaModule";

type CheckCacheGroup = (
  module: Module,
  context: { chunkGraph: ChunkGraph, moduleGraph: ModuleGraph }
) => { key?: string; }[];

type Paths = string[];
export { UsedIdCache };
export type CSSOutput = Map<Chunk, {
  filePaths: Paths;
  usedIds: UsedIdCache;
  parents: Chunk[];
  modules: NavitaModuleInstance[];
}>;

export function prepareCssOutput({
  compilation,
  engine,
  checkCacheGroup,
}: {
  compilation: Compilation;
  engine: Engine;
  checkCacheGroup: CheckCacheGroup;
}) {
  const { compiler, chunkGraph, moduleGraph } = compilation;
  const NavitaModule = getNavitaModule(compiler.webpack);

  const map = new Map<Chunk, {
    modules: NavitaModuleInstance[];
    filePaths: Paths;
    parents: Chunk[];
    usedIds: UsedIdCache;
    canUseOpinionatedLayers?: boolean;
  }>();

  const addToMap = (
    chunk: Chunk,
    module: NavitaModuleInstance,
    intentional?: boolean | undefined
  ) => {
    if (!map.has(chunk)) {
      map.set(chunk, {
        modules: [],
        filePaths: [],
        parents: [],
        usedIds: {},
        canUseOpinionatedLayers: true,
      });
    }

    const value = map.get(chunk)!;

    const { modules, filePaths } = value;

    if (!modules.includes(module)) {
      modules.push(module);
    }

    if (!filePaths.includes(module.issuerPath)) {
      filePaths.push(module.issuerPath);
    }

    if (chunk.chunkReason !== undefined && intentional !== undefined) {
      value.canUseOpinionatedLayers = !intentional;
    }
  }

  for (const module of compilation.modules) {
    if (!(module instanceof NavitaModule)) {
      continue;
    }

    const chunks = chunkGraph.getModuleChunks(module);

    let intentional: boolean | undefined;

    for (const chunk of chunks) {
      if (chunk.chunkReason !== undefined) {
        if (intentional === undefined) {
          // We'll only check the cache group if we really need to.
          intentional = checkCacheGroup(module, { chunkGraph, moduleGraph }).length > 0;
        }

        if (!intentional) {
          const chunks = Array.from(
            chunkGraph.moduleGraph.getIncomingConnections(module)
          ).flatMap((x) => chunkGraph.getModuleChunks(x.originModule));

          for (const chunk of chunks) {
            addToMap(chunk, module);
          }

          continue;
        }
      }

      addToMap(chunk, module, intentional);
    }
  }

  for (const [chunk, value] of map) {
    value.usedIds = engine.getCacheIds(value.filePaths);
    value.parents = Array.from(chunk.groupsIterable)
      .flatMap((x) => x.getParents())
      .flatMap((x) => x.chunks)
      .filter((x) => map.has(x));
  }

  return map;
}
