import { vi } from "vitest";
import type { Chunk } from "webpack";
import { getNavitaModule } from "../../src/getNavitaModule";
import { prepareCssOutput } from "../../src/prepareCssOutput";

const makeWebpack = () => {
  class Module {
    type: string;
    buildInfo: unknown;
    constructor(type: string) {
      this.type = type;
    }
    serialize() {}
    deserialize() {}
  }

  return {
    Module,
    util: { serialization: { register: vi.fn() } },
  };
};

describe("prepareCssOutput", () => {
  it("maps NavitaModules to their chunks and resolves used ids", () => {
    const webpack = makeWebpack();
    const NavitaModule = getNavitaModule(webpack as never);

    const moduleA = new NavitaModule("/src/a.ts", "hashA");
    const moduleB = new NavitaModule("/src/b.ts", "hashB");
    const nonNavitaModule = { nameForCondition: () => "/src/c.ts" };

    const chunk = {
      chunkReason: undefined,
      groupsIterable: [],
    } as unknown as Chunk;

    const chunkGraph = {
      getModuleChunks: (module: unknown) =>
        module === moduleA || module === moduleB ? [chunk] : [],
      moduleGraph: { getIncomingConnections: () => [] },
    };

    const engine = {
      getCacheIds: (filePaths: string[]) => ({ rule: filePaths }),
    };

    const compilation = {
      compiler: { webpack },
      chunkGraph,
      moduleGraph: {},
      modules: [moduleA, moduleB, nonNavitaModule],
    };

    const checkCacheGroup = vi.fn(() => []);

    const output = prepareCssOutput({
      compilation: compilation as never,
      engine: engine as never,
      checkCacheGroup,
    });

    expect(output.size).toBe(1);

    const value = output.get(chunk)!;
    expect(value.modules).toEqual([moduleA, moduleB]);
    expect(value.filePaths).toEqual(["/src/a.ts", "/src/b.ts"]);
    expect(value.usedIds).toEqual({ rule: ["/src/a.ts", "/src/b.ts"] });
    expect(value.parents).toEqual([]);

    // The non-Navita module is ignored, and the simple (undefined chunkReason)
    // path never consults the cache group.
    expect(checkCacheGroup).not.toHaveBeenCalled();
  });

  it("groups modules that belong to different chunks", () => {
    const webpack = makeWebpack();
    const NavitaModule = getNavitaModule(webpack as never);

    const moduleA = new NavitaModule("/src/a.ts", "hashA");
    const moduleB = new NavitaModule("/src/b.ts", "hashB");

    const chunkA = {
      chunkReason: undefined,
      groupsIterable: [],
    } as unknown as Chunk;
    const chunkB = {
      chunkReason: undefined,
      groupsIterable: [],
    } as unknown as Chunk;

    const chunkGraph = {
      getModuleChunks: (module: unknown) => {
        if (module === moduleA) return [chunkA];
        if (module === moduleB) return [chunkB];
        return [];
      },
      moduleGraph: { getIncomingConnections: () => [] },
    };

    const output = prepareCssOutput({
      compilation: {
        compiler: { webpack },
        chunkGraph,
        moduleGraph: {},
        modules: [moduleA, moduleB],
      } as never,
      engine: {
        getCacheIds: (filePaths: string[]) => ({ rule: filePaths }),
      } as never,
      checkCacheGroup: vi.fn(() => []),
    });

    expect(output.size).toBe(2);
    expect(output.get(chunkA)!.filePaths).toEqual(["/src/a.ts"]);
    expect(output.get(chunkB)!.filePaths).toEqual(["/src/b.ts"]);
  });
});
