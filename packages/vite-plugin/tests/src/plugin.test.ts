import { createRenderer } from "@navita/core/createRenderer";
import { importMap } from "@navita/css";
import { vi } from "vitest";
import { getRenderer, navita, VIRTUAL_MODULE_ID } from "../../src/index";

/**
 * Core behaviour of the navita Vite plugin, driven with a REAL renderer
 * (createRenderer) so style extraction and CSS accumulation go through the
 * actual @navita/core + @navita/engine pipeline. The plugin keeps its renderer
 * on a globalThis key, so each test installs a fresh renderer and clears it
 * afterwards to stay isolated.
 */
const RENDERER_KEY = "__navita_renderer";
const RESOLVED_ID = "\0virtual:navita";

function makeRenderer() {
  return createRenderer({
    context: process.cwd(),
    engineOptions: { enableSourceMaps: false, enableDebugIdentifiers: false },
    importMap,
    resolver: async () => null as unknown as string,
    readFile: async () => "",
  });
}

type AnyPlugin = Record<string, any>;

function setupPlugin({
  mode = "production",
}: {
  mode?: string;
} = {}): AnyPlugin {
  const plugin = navita() as AnyPlugin;
  plugin.configResolved({ root: process.cwd(), mode, base: "/" });
  return plugin;
}

// Code that uses navita so the transform proceeds to extraction. `id` is kept
// unique per test because @navita/core caches compiled modules by file path.
const navitaCode = (id: string) =>
  `import { style } from '@navita/css';\nexport const ${id} = style({ color: 'red' });`;

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[RENDERER_KEY];
});

describe("navita() — buildStart", () => {
  it("creates a renderer when none exists yet", () => {
    delete (globalThis as Record<string, unknown>)[RENDERER_KEY];
    const plugin = setupPlugin();
    plugin.buildStart.call({
      resolve: vi.fn().mockResolvedValue({ id: "/x" }),
    });
    expect(getRenderer()).toBeDefined();
  });

  it("is idempotent when a renderer already exists", () => {
    const existing = makeRenderer();
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = existing;
    const plugin = setupPlugin();
    plugin.buildStart.call({ resolve: vi.fn() });
    expect(getRenderer()).toBe(existing);
  });
});

describe("navita() — transform", () => {
  it("extracts navita styles and accumulates CSS in the renderer (happy path)", async () => {
    const renderer = makeRenderer();
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
    const plugin = setupPlugin();

    const id = "/project/src/happy.ts";
    const result = (await plugin.transform.call(
      { addWatchFile: vi.fn() },
      navitaCode("happy"),
      id,
    )) as { code: string } | null;

    expect(result).not.toBeNull();
    // The style() call is replaced with the generated class name string.
    expect(result!.code).not.toContain("style({ color: 'red' })");
    // The CSS landed in the renderer's engine.
    expect(renderer.engine.renderCssToString()).toContain("color:red");
  });

  it("returns null and clears the cache for files with no navita import", async () => {
    const renderer = makeRenderer();
    const clearSpy = vi.spyOn(renderer, "clearCache");
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
    const plugin = setupPlugin();

    const id = "/project/src/plain.ts";
    const result = await plugin.transform.call({}, "export const x = 1;", id);

    expect(result).toBeNull();
    expect(clearSpy).toHaveBeenCalledWith(id);
  });

  it("skips files inside node_modules without extracting", async () => {
    const renderer = makeRenderer();
    const processSpy = vi.spyOn(renderer, "transformAndProcess");
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
    const plugin = setupPlugin();

    const result = await plugin.transform.call(
      {},
      navitaCode("dep"),
      "/project/node_modules/foo/index.js",
    );

    expect(result).toBeNull();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it("returns null when no renderer is installed", async () => {
    delete (globalThis as Record<string, unknown>)[RENDERER_KEY];
    const plugin = setupPlugin();

    const result = await plugin.transform.call(
      {},
      navitaCode("norenderer"),
      "/project/src/x.ts",
    );

    expect(result).toBeNull();
  });
});

describe("navita() — virtual module (resolveId / load)", () => {
  it("resolveId maps virtual:navita.css (with or without a query) to the resolved id", () => {
    const plugin = setupPlugin();
    expect(plugin.resolveId("virtual:navita.css")).toBe(RESOLVED_ID);
    expect(plugin.resolveId("/virtual:navita.css?direct")).toBe(RESOLVED_ID);
  });

  it("resolveId ignores unrelated ids", () => {
    const plugin = setupPlugin();
    expect(plugin.resolveId("some-other-module")).toBeUndefined();
  });

  it("load returns the renderer CSS for the resolved virtual id", async () => {
    const renderer = makeRenderer();
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
    const plugin = setupPlugin();

    await plugin.transform.call(
      { addWatchFile: vi.fn() },
      navitaCode("load"),
      "/project/src/load.ts",
    );

    const out = (await plugin.load(RESOLVED_ID)) as {
      code: string;
      map: unknown;
    };
    expect(out.code).toContain("color:red");
    expect(out.map).toEqual({ mappings: "" });
  });

  it("load ignores unrelated ids", async () => {
    const plugin = setupPlugin();
    expect(await plugin.load("some-other-id")).toBeUndefined();
  });
});

describe("navita() — renderChunk", () => {
  /** A plugin context for the given build environment. */
  function makeCtx(environmentName: string) {
    return {
      environment: { name: environmentName },
      emitFile: vi.fn().mockReturnValue("ref-1"),
      getFileName: vi.fn().mockReturnValue("assets/navita-abc.css"),
    };
  }

  it("emits the navita CSS asset once in the client environment", async () => {
    const renderer = makeRenderer();
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
    const plugin = setupPlugin();

    await plugin.transform.call(
      { addWatchFile: vi.fn() },
      navitaCode("chunk"),
      "/project/src/chunk.ts",
    );

    const ctx = makeCtx("client");
    const importedCss = new Set<string>();
    plugin.renderChunk.call(ctx, "", { viteMetadata: { importedCss } });

    expect(ctx.emitFile).toHaveBeenCalledTimes(1);
    expect(ctx.emitFile.mock.calls[0][0]).toMatchObject({
      name: "navita.css",
      type: "asset",
    });
    expect(ctx.emitFile.mock.calls[0][0].source).toContain("color:red");
    expect(ctx.getFileName).toHaveBeenCalledWith("ref-1");
    expect(importedCss.has("assets/navita-abc.css")).toBe(true);

    // The cssEmitted guard makes subsequent client calls no-ops.
    plugin.renderChunk.call(ctx, "", {
      viteMetadata: { importedCss: new Set<string>() },
    });
    expect(ctx.emitFile).toHaveBeenCalledTimes(1);
  });

  it("is a no-op outside the client environment", async () => {
    const renderer = makeRenderer();
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
    const plugin = setupPlugin();

    await plugin.transform.call(
      { addWatchFile: vi.fn() },
      navitaCode("srv"),
      "/project/src/srv.ts",
    );

    // rwsdk's throwaway worker / ssr passes must not consume the emission.
    for (const env of ["worker", "ssr"]) {
      const ctx = makeCtx(env);
      plugin.renderChunk.call(ctx, "", {
        viteMetadata: { importedCss: new Set<string>() },
      });
      expect(ctx.emitFile).not.toHaveBeenCalled();
    }
  });

  it("does not flip the latch when the renderer is still empty", async () => {
    // A client chunk that renders before anything compiled (empty CSS) must not
    // consume the single emission — a later populated client chunk still emits.
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = makeRenderer();
    const plugin = setupPlugin();

    const empty = makeCtx("client");
    plugin.renderChunk.call(empty, "", {
      viteMetadata: { importedCss: new Set<string>() },
    });
    expect(empty.emitFile).not.toHaveBeenCalled();

    // Now some styles get compiled, and the next client chunk emits.
    await plugin.transform.call(
      { addWatchFile: vi.fn() },
      navitaCode("late"),
      "/project/src/late.ts",
    );

    const populated = makeCtx("client");
    plugin.renderChunk.call(populated, "", {
      viteMetadata: { importedCss: new Set<string>() },
    });
    expect(populated.emitFile).toHaveBeenCalledTimes(1);
  });
});

describe("navita() — transformIndexHtml", () => {
  it("injects a stylesheet link in dev", async () => {
    const plugin = setupPlugin({ mode: "development" });
    const tags = await plugin.transformIndexHtml.handler("<html></html>");
    expect(tags).toEqual([
      {
        tag: "link",
        injectTo: "head",
        attrs: { rel: "stylesheet", href: `/${VIRTUAL_MODULE_ID}` },
      },
    ]);
  });

  it("injects nothing during a production build", async () => {
    const plugin = setupPlugin({ mode: "production" });
    expect(await plugin.transformIndexHtml.handler("<html></html>")).toEqual(
      [],
    );
  });
});

describe("navita() — dev HMR (updateNavitaCSS debounce)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces rapid transforms into a single debounced css-update", async () => {
    vi.useFakeTimers();

    const renderer = makeRenderer();
    // Stub extraction so the dev path runs without real evaluation under fake
    // timers — the debounce/HMR logic is what's under test here.
    vi.spyOn(renderer, "transformAndProcess").mockResolvedValue({
      result: 'export const x = "a1";',
      sourceMap: null as never,
      dependencies: [],
    });
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;

    const mod = { id: RESOLVED_ID };
    const invalidateModule = vi.fn();
    const send = vi.fn();
    const server = {
      moduleGraph: {
        getModuleById: vi.fn().mockReturnValue(mod),
        invalidateModule,
      },
      ws: { send },
    };

    const plugin = setupPlugin({ mode: "development" });
    plugin.configureServer(server);

    const ctx = { addWatchFile: vi.fn() };
    await plugin.transform.call(ctx, navitaCode("a"), "/p/a.ts");
    await plugin.transform.call(ctx, navitaCode("b"), "/p/b.ts");
    await plugin.transform.call(ctx, navitaCode("c"), "/p/c.ts");

    // Nothing fires until the debounce window elapses.
    expect(send).not.toHaveBeenCalled();

    vi.advanceTimersByTime(25);

    expect(invalidateModule).toHaveBeenCalledWith(mod);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "update",
        updates: [
          expect.objectContaining({
            type: "css-update",
            path: `/${VIRTUAL_MODULE_ID}`,
            acceptedPath: `/${VIRTUAL_MODULE_ID}`,
          }),
        ],
      }),
    );
  });

  it("still sends the css-update when the virtual module isn't in the graph", async () => {
    // Under rwsdk the stylesheet is served by a middleware, so the virtual
    // module never enters the graph. The notification must fire regardless, or
    // style HMR silently stops (Gap 2).
    vi.useFakeTimers();

    const renderer = makeRenderer();
    vi.spyOn(renderer, "transformAndProcess").mockResolvedValue({
      result: 'export const x = "a1";',
      sourceMap: null as never,
      dependencies: [],
    });
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;

    const invalidateModule = vi.fn();
    const send = vi.fn();
    const server = {
      moduleGraph: {
        getModuleById: vi.fn().mockReturnValue(undefined),
        invalidateModule,
      },
      ws: { send },
    };

    const plugin = setupPlugin({ mode: "development" });
    plugin.configureServer(server);

    await plugin.transform.call(
      { addWatchFile: vi.fn() },
      navitaCode("a"),
      "/p/a.ts",
    );

    vi.advanceTimersByTime(25);

    // No module to invalidate, but the browser is still told to re-fetch.
    expect(invalidateModule).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "update",
        updates: [
          expect.objectContaining({
            type: "css-update",
            path: `/${VIRTUAL_MODULE_ID}`,
          }),
        ],
      }),
    );
  });
});
