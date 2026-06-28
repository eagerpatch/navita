import { createRenderer } from "@navita/core/createRenderer";
import { importMap } from "@navita/css";
import { vi } from "vitest";
import { navitaRemix } from "../../src/remix";

const RENDERER_KEY = "__navita_renderer";

function installRenderer() {
  const renderer = createRenderer({
    context: process.cwd(),
    engineOptions: { enableSourceMaps: false, enableDebugIdentifiers: false },
    importMap,
    resolver: async () => null as unknown as string,
    readFile: async () => "",
  });
  (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
  return renderer;
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[RENDERER_KEY];
});

type AnyPlugin = Record<string, any>;

describe("navitaRemix", () => {
  it("returns the navita plugin (with its own renderChunk removed) plus a remix plugin", () => {
    const [navitaPlugin, remixPlugin] = navitaRemix() as AnyPlugin[];
    expect(navitaPlugin.name).toBe("navita");
    // Remix/react-router drives renderChunk itself.
    expect(navitaPlugin.renderChunk).toBeUndefined();
    expect(remixPlugin.name).toBe("navita-remix");
  });

  describe("transform (server-build link injection)", () => {
    const serverBuildIds = [
      "\0virtual:remix/server-build",
      "\0virtual:react-router/server-build",
    ];

    it.each(
      serverBuildIds,
    )("appends the stylesheet links extension for %s in dev", (id) => {
      const [, remix] = navitaRemix() as AnyPlugin[];
      remix.configResolved({ mode: "development" });

      const out = remix.transform("export const route0 = {};", id);

      expect(out).toContain("export const route0 = {};");
      expect(out).toContain("routes.root.module");
      expect(out).toContain("rel: 'stylesheet'");
      expect(out).toContain("href: '/virtual:navita.css'");
    });

    it("does nothing for unrelated module ids", () => {
      const [, remix] = navitaRemix() as AnyPlugin[];
      remix.configResolved({ mode: "development" });
      expect(remix.transform("code", "/some/app/file.ts")).toBeUndefined();
    });

    it("does nothing during a production build", () => {
      const [, remix] = navitaRemix() as AnyPlugin[];
      remix.configResolved({ mode: "production" });
      expect(
        remix.transform("code", "\0virtual:remix/server-build"),
      ).toBeUndefined();
    });
  });

  describe("renderChunk (CSS emission across client/server builds)", () => {
    it("registers a random CSS file on the client root chunk and emits it from the server build", () => {
      installRenderer();
      const [, remix] = navitaRemix() as AnyPlugin[];

      // Client build, root chunk: a random CSS file name is registered.
      const clientCss = new Set<string>();
      remix.renderChunk.call(
        {},
        "",
        { name: "root", viteMetadata: { importedCss: clientCss } },
        { dir: "/build/client" },
      );

      expect(clientCss.size).toBe(1);
      const [fileName] = [...clientCss];
      expect(fileName).toMatch(/^assets\/navita-[a-zA-Z0-9]{8}\.css$/);

      // Server build: the same file name is emitted as an asset.
      const emitFile = vi.fn();
      remix.renderChunk.call(
        { emitFile },
        "",
        {
          name: "entry.server",
          viteMetadata: { importedCss: new Set<string>() },
        },
        { dir: "/build/server" },
      );

      expect(emitFile).toHaveBeenCalledTimes(1);
      expect(emitFile.mock.calls[0][0]).toMatchObject({
        fileName,
        name: "navita.css",
        type: "asset",
      });
    });

    it("only emits the server CSS asset once", () => {
      installRenderer();
      const [, remix] = navitaRemix() as AnyPlugin[];

      remix.renderChunk.call(
        {},
        "",
        { name: "root", viteMetadata: { importedCss: new Set<string>() } },
        { dir: "/build/client" },
      );

      const emitFile = vi.fn();
      const serverChunk = {
        name: "entry.server",
        viteMetadata: { importedCss: new Set<string>() },
      };
      remix.renderChunk.call({ emitFile }, "", serverChunk, {
        dir: "/build/server",
      });
      remix.renderChunk.call({ emitFile }, "", serverChunk, {
        dir: "/build/server",
      });

      expect(emitFile).toHaveBeenCalledTimes(1);
    });
  });
});
