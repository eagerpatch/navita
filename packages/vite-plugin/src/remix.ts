import * as crypto from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";
import type { Options } from "./index";
import { getRenderer, navita, VIRTUAL_MODULE_ID } from "./index";

let cssFileName: string;

export function navitaRemix(options?: Options): Plugin[] {
  let server: ViteDevServer;

  const { renderChunk, ...navitaVite } = navita(options);

  return [
    navitaVite,
    {
      name: 'navita-remix',
      configureServer(_server) {
        server = _server;

        server.middlewares.use(async function middleware(_req, _res, next) {
          try {
            const build = await server.ssrLoadModule(
              'virtual:remix/server-build',
            );

            const { module } = build.routes.root;

            // We modify the root module, to automatically include the CSS
            // when running the dev server.
            build.routes.root.module = {
              ...module,
              links: () => [
                ...module.links(),
                { rel: 'stylesheet', href: `/${VIRTUAL_MODULE_ID}` },
              ],
            };
          } catch(e) {
            console.error(e);
          }

          next();
        });
      },
      renderChunk(_, chunk) {
        if (chunk.name === "root") {
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

          // Attach the file to the root chunk so that it's included in the client build.
          chunk.viteMetadata?.importedCss.add(cssFileName);
          return;
        }

        if (chunk.name === 'server-build') {
          // In the server-build, we'll generate the CSS and emit it as an asset.
          // Remix will then move it to the client assets.
          this.emitFile({
            fileName: cssFileName,
            name: 'navita.css',
            type: 'asset',
            source: getRenderer()?.engine.renderCssToString(),
          });
        }
      },
    }
  ];
}
