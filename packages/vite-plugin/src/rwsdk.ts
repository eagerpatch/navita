import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { Plugin } from "vite";
import type { Options } from "./index";
import { getRenderer, navita, VIRTUAL_MODULE_ID } from "./index";

export function navitaRwsdk(options?: Options): Plugin[] {
  let projectRootDir: string;
  let base: string;

  const navitaPlugin = navita(options);

  const rwsdkPlugin: Plugin = {
    name: "navita-rwsdk",
    enforce: "post",

    configResolved(config) {
      projectRootDir = config.root;
      base = config.base;
    },

    // Gap 1 — dev: serve `/virtual:navita.css` directly as text/css.
    //
    // rwsdk evaluates a module that resolves to `.css` in its worker env, which
    // has no CSS transform pipeline: it runs JS import-analysis over the raw CSS
    // and throws "invalid JS syntax", so the browser's stylesheet request 500s
    // and the page renders unstyled. Answering the request from a middleware —
    // before Vite's transform middleware — keeps the CSS out of the worker env.
    //
    // navita is source-served, so a route's components are compiled during SSR
    // (before its HTML, hence before this fetch), so the renderer's output is
    // complete for the route by the time the browser asks for the stylesheet.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== `/${VIRTUAL_MODULE_ID}`) {
          return next();
        }

        res.setHeader("Content-Type", "text/css");
        res.setHeader("Cache-Control", "no-cache");
        res.end(getRenderer()?.engine.renderCssToString() ?? "");
      });
    },

    async renderChunk(code) {
      // Build: rewrite the `virtual:navita.css` link href to the hashed asset
      // path. The base navita plugin emits `navita.css` in the client build
      // (gated to the client env, so rwsdk's early empty worker pass can't
      // consume it); here we only patch references in the linker pass.
      const environmentName = this.environment?.name;

      if (
        environmentName !== "worker" ||
        process.env.RWSDK_BUILD_PASS !== "linker"
      ) {
        return null;
      }

      // Read the client manifest to find the navita CSS path
      const manifestPath = path.resolve(
        projectRootDir,
        "dist",
        "client",
        ".vite",
        "manifest.json",
      );

      let manifestContent: string;
      try {
        manifestContent = await fsp.readFile(manifestPath, "utf-8");
      } catch {
        console.warn(
          "[navita-rwsdk] Could not read client manifest, skipping CSS replacement",
        );
        return null;
      }

      const manifest = JSON.parse(manifestContent) as Record<
        string,
        {
          file: string;
          css?: string[];
        }
      >;

      // Find the navita CSS file in the manifest
      let navitaCssPath: string | null = null;

      for (const [key, value] of Object.entries(manifest)) {
        // Check if this is the navita CSS entry directly
        if (key.includes("navita") && key.endsWith(".css")) {
          navitaCssPath = (base || "/") + value.file;
          break;
        }
        // Also check if it's referenced in the css array of any entry
        if (value.css) {
          for (const cssFile of value.css) {
            if (cssFile.includes("navita")) {
              navitaCssPath = (base || "/") + cssFile;
              break;
            }
          }
          if (navitaCssPath) break;
        }
      }

      if (!navitaCssPath) {
        console.warn("[navita-rwsdk] Could not find navita CSS in manifest");
        return null;
      }

      // Replace virtual:navita.css references with the actual hashed path
      let newCode = code;
      newCode = newCode.replaceAll(`/${VIRTUAL_MODULE_ID}`, navitaCssPath);
      newCode = newCode.replaceAll(VIRTUAL_MODULE_ID, navitaCssPath);

      if (newCode !== code) {
        return { code: newCode, map: null };
      }

      return null;
    },
  };

  return [navitaPlugin, rwsdkPlugin];
}
