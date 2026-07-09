import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { vi } from "vitest";
import { navitaRwsdk } from "../../src/rwsdk";

type AnyPlugin = Record<string, any>;

/** Stub the global renderer singleton to return a fixed CSS string. */
function stubRenderer(css: string | undefined) {
  const prev = (globalThis as any).__navita_renderer;
  (globalThis as any).__navita_renderer = {
    engine: { renderCssToString: () => css },
  };
  return () => {
    (globalThis as any).__navita_renderer = prev;
  };
}

const tmpRoots: string[] = [];

/** Create a throwaway project root, optionally seeded with a client manifest. */
function makeProject(manifest?: Record<string, unknown>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "navita-rwsdk-"));
  tmpRoots.push(root);
  if (manifest) {
    const dir = path.join(root, "dist", "client", ".vite");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest));
  }
  return root;
}

function makeRwsdkPlugin(root: string, base = "/"): AnyPlugin {
  const [, rwsdk] = navitaRwsdk() as AnyPlugin[];
  rwsdk.configResolved({ root, base });
  return rwsdk;
}

afterEach(() => {
  delete process.env.RWSDK_BUILD_PASS;
});

afterAll(() => {
  for (const root of tmpRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("navitaRwsdk", () => {
  it("returns the navita plugin plus a post-enforced navita-rwsdk plugin", () => {
    const [navitaPlugin, rwsdkPlugin] = navitaRwsdk() as AnyPlugin[];
    expect(navitaPlugin.name).toBe("navita");
    // The base navita plugin owns CSS emission under rwsdk (client env).
    expect(navitaPlugin.renderChunk).toBeDefined();
    expect(rwsdkPlugin.name).toBe("navita-rwsdk");
    expect(rwsdkPlugin.enforce).toBe("post");
  });

  describe("configureServer — dev CSS middleware (Gap 1)", () => {
    /** Drive the registered middleware with a fake req/res. */
    function runMiddleware(url: string) {
      const [, rwsdk] = navitaRwsdk() as AnyPlugin[];
      let handler: any;
      rwsdk.configureServer({
        middlewares: { use: (fn: any) => (handler = fn) },
      });

      const headers: Record<string, string> = {};
      const res = {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        end: vi.fn(),
      };
      const next = vi.fn();
      handler({ url }, res, next);
      return { headers, res, next };
    }

    it("serves /virtual:navita.css as text/css from the renderer", () => {
      const restore = stubRenderer(".a{color:red}");
      const { headers, res, next } = runMiddleware("/virtual:navita.css");
      restore();

      expect(next).not.toHaveBeenCalled();
      expect(headers["Content-Type"]).toBe("text/css");
      expect(headers["Cache-Control"]).toBe("no-cache");
      expect(res.end).toHaveBeenCalledWith(".a{color:red}");
    });

    it("ignores the query string when matching the stylesheet URL", () => {
      const restore = stubRenderer(".a{color:red}");
      const { res, next } = runMiddleware("/virtual:navita.css?t=123");
      restore();

      expect(next).not.toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(".a{color:red}");
    });

    it("serves an empty stylesheet when the renderer has no output yet", () => {
      const restore = stubRenderer(undefined);
      const { res, next } = runMiddleware("/virtual:navita.css");
      restore();

      expect(next).not.toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith("");
    });

    it("passes unrelated requests through to the next middleware", () => {
      const { res, next } = runMiddleware("/some/other/path");
      expect(next).toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
    });
  });

  describe("renderChunk", () => {
    it("is a no-op outside the worker environment", async () => {
      process.env.RWSDK_BUILD_PASS = "linker";
      const rwsdk = makeRwsdkPlugin(makeProject());
      const out = await rwsdk.renderChunk.call(
        { environment: { name: "client" } },
        "code",
      );
      expect(out).toBeNull();
    });

    it("is a no-op when not in the linker build pass", async () => {
      delete process.env.RWSDK_BUILD_PASS;
      const rwsdk = makeRwsdkPlugin(makeProject());
      const out = await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        "code",
      );
      expect(out).toBeNull();
    });

    it("rewrites virtual:navita.css to the hashed manifest path (direct .css entry)", async () => {
      const root = makeProject({
        "virtual:navita.css": { file: "assets/navita-abc123.css" },
      });
      const rwsdk = makeRwsdkPlugin(root);
      process.env.RWSDK_BUILD_PASS = "linker";

      const code =
        'const href = "/virtual:navita.css";\nimport "virtual:navita.css";';
      const out = (await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        code,
      )) as { code: string; map: unknown } | null;

      expect(out).not.toBeNull();
      expect(out!.code).toContain("/assets/navita-abc123.css");
      expect(out!.code).not.toContain("virtual:navita.css");
      expect(out!.map).toBeNull();
    });

    it("honours a non-root base when rewriting the CSS path", async () => {
      const root = makeProject({
        "virtual:navita.css": { file: "assets/navita-xyz.css" },
      });
      const rwsdk = makeRwsdkPlugin(root, "/my-base/");
      process.env.RWSDK_BUILD_PASS = "linker";

      const out = (await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        'a "/virtual:navita.css" b',
      )) as { code: string } | null;

      expect(out!.code).toContain("/my-base/assets/navita-xyz.css");
    });

    it("finds the navita CSS referenced in an entry css array", async () => {
      const root = makeProject({
        "src/client.tsx": {
          file: "assets/client-1.js",
          css: ["assets/other.css", "assets/navita-deadbeef.css"],
        },
      });
      const rwsdk = makeRwsdkPlugin(root);
      process.env.RWSDK_BUILD_PASS = "linker";

      const out = (await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        'x "/virtual:navita.css" y',
      )) as { code: string } | null;

      expect(out!.code).toContain("/assets/navita-deadbeef.css");
    });

    it("returns null (and warns) when the code has no virtual references to rewrite", async () => {
      const root = makeProject({
        "virtual:navita.css": { file: "assets/navita-abc123.css" },
      });
      const rwsdk = makeRwsdkPlugin(root);
      process.env.RWSDK_BUILD_PASS = "linker";

      const out = await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        "const unrelated = 1;",
      );

      // Nothing changed → null is returned so Vite keeps the original chunk.
      expect(out).toBeNull();
    });

    it("returns null and warns when the client manifest is missing", async () => {
      const rwsdk = makeRwsdkPlugin(
        path.join(os.tmpdir(), "navita-missing-xyz"),
      );
      process.env.RWSDK_BUILD_PASS = "linker";
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const out = await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        'code "/virtual:navita.css"',
      );

      expect(out).toBeNull();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it("returns null and warns when no navita CSS is present in the manifest", async () => {
      const root = makeProject({
        "index.html": { file: "assets/index-123.js" },
      });
      const rwsdk = makeRwsdkPlugin(root);
      process.env.RWSDK_BUILD_PASS = "linker";
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const out = await rwsdk.renderChunk.call(
        { environment: { name: "worker" } },
        'code "/virtual:navita.css"',
      );

      expect(out).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("Could not find navita CSS"),
      );
      warn.mockRestore();
    });
  });
});
