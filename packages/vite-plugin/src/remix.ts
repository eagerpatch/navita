import * as crypto from "node:crypto";
import type { Plugin } from "vite";
import type { Options } from "./index";
import { getRenderer, navita, VIRTUAL_MODULE_ID } from "./index";

const remixServerBuildId = '\0virtual:remix/server-build';
let cssFileName: string;

export function navitaRemix(options?: Options): Plugin[] {
  let isProduction = false;
  let hasEmittedCss = false;

  const { renderChunk, ...navitaVite } = navita(options);

  return [
    navitaVite,
    {
      name: 'navita-remix',
      configResolved(config) {
        isProduction = config.mode === 'production';
      },
      transform(code, id) {
        if (isProduction || id !== remixServerBuildId) {
          return;
        }

        return `${code}\n${remixServerBuildExtension}`;
      },
      renderChunk(_, chunk, options) {
        const isServerChunk = options.dir.endsWith('/server');
        const isClientChunk = options.dir.endsWith('/client');

        if (isClientChunk && chunk.name === "root") {
          // Generate a random name for the CSS file.
          // Vite uses a file hash as the name, but since the client build will finish before
          // the server build, we need to generate a random name for the CSS file.
          // Ideally we could use a hash, but since the server might contain more styles than the client, we need to do it like this.
          const random = crypto
            .randomBytes(30)
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 8);

          cssFileName = `assets/navita-${random}.css`;

          chunk.viteMetadata.importedCss.add(cssFileName);
          return;
        }

        if (isServerChunk && !hasEmittedCss) {
          // In the server-build, we'll generate the CSS and emit it as an asset.
          // Remix will then move it to the client assets.
          this.emitFile({
            fileName: cssFileName,
            name: 'navita.css',
            type: 'asset',
            source: getRenderer()?.engine.renderCssToString(),
          });

          hasEmittedCss = true;
        }
      },
    }
  ];
}

const remixServerBuildExtension = `
  routes.root.module = {
    ...route0,
    links: () => [
      ...(route0.links ? route0.links() : []),
      { rel: 'stylesheet', href: '/${VIRTUAL_MODULE_ID}' },
    ],
  };
`;
