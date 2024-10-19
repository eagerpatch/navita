import type { Plugin, ViteDevServer } from "vite";
import { getRenderer, navita, VIRTUAL_MODULE_ID } from "./index";

export function navitaRemix(): Plugin[] {
  let server: ViteDevServer;

  const { renderChunk, ...navitaVite } = navita();

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

            // We modify the root module, to automatically include the CSS when running the dev server.
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
        if (chunk.name === 'root') {
          // Attach the file to the root chunk so that it's included in the
          // client build.
          chunk.viteMetadata?.importedCss.add(`assets/navita.css`);
          return;
        }

        if (chunk.name === 'server-build') {
          // In the server-build, we'll generate the CSS and emit it as an asset.
          // Remix will then move it to the client assets.
          this.emitFile({
            fileName: `assets/navita.css`,
            name: 'navita.css',
            type: 'asset',
            source: getRenderer()?.engine.renderCssToString(),
          });
        }
      },
    }
  ];
}
