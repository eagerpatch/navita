import { getNavitaDependency } from "@navita/webpack-plugin";
import type { LoaderContext } from "webpack";

export function pitch(this: LoaderContext<unknown>) {
  this._module.loaders = [];

  const dependency = getNavitaDependency(this._compiler.webpack);

  const { cssHash, issuerPath } = Object.fromEntries(
    new URLSearchParams(this.resourceQuery).entries()
  );

  this._module.addDependency(
    new dependency(issuerPath, cssHash)
  );

  // We set the layer to something other than WEBPACK_LAYERS.appPagesBrowser to
  // not have the modules included in the next pageManifest.
  // Our modules are empty and aren't used for anything other than for collecting information.
  // And are not even included in the final bundle.
  // https://github.com/vercel/next.js/blob/8c6532fa7045879feb13bb21c530bb1517378e29/packages/next/src/build/webpack/plugins/flight-manifest-plugin.ts#L404
  // https://github.com/vercel/next.js/blob/8c6532fa7045879feb13bb21c530bb1517378e29/packages/next/src/lib/constants.ts#L146
  this._module.layer = 'not-app-pages-browser';

  return '';
}
