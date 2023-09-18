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

  return '';
}
