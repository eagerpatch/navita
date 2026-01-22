import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { Plugin } from "vite";
import type { Options } from "./index";
import { navita, VIRTUAL_MODULE_ID } from "./index";

export function navitaRwsdk(options?: Options): Plugin[] {
  let projectRootDir: string;
  let base: string;

  const navitaPlugin = navita(options);

  return [
    navitaPlugin,
    {
      name: "navita-rwsdk",
      enforce: "post",

      configResolved(config) {
        projectRootDir = config.root;
        base = config.base;
      },

      async renderChunk(code) {
        // Only run during the linker pass on the worker environment
        // @ts-expect-error - environment exists at runtime in Vite 6+
        const environmentName = this.environment?.name;

        if (environmentName !== "worker" || process.env.RWSDK_BUILD_PASS !== "linker") {
          return null;
        }

        // Read the client manifest to find the navita CSS path
        const manifestPath = path.resolve(
          projectRootDir,
          "dist",
          "client",
          ".vite",
          "manifest.json"
        );

        let manifestContent: string;
        try {
          manifestContent = await fsp.readFile(manifestPath, "utf-8");
        } catch {
          console.warn("[navita-rwsdk] Could not read client manifest, skipping CSS replacement");
          return null;
        }

        const manifest = JSON.parse(manifestContent) as Record<string, {
          file: string;
          css?: string[];
        }>;

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
    },
  ];
}
