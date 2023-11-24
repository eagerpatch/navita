import type { createRenderer, ImportMap } from "@navita/core/createRenderer";
import type { LoaderContext } from "webpack";
import type { LoaderDefinitionFunction } from "webpack";
import { createHashFunction } from "./createHashFunction";
import type { NavitaDependency } from "./getNavitaDependency";

interface Options {
  importMap: ImportMap;
  renderer: ReturnType<typeof createRenderer>;
  outputCss: boolean;
  NavitaDependency: NavitaDependency;
}

type LoaderParams = Parameters<LoaderDefinitionFunction<Options>>;

export default async function loader(
  this: LoaderContext<Options>,
  content: LoaderParams[0],
  sourceMap: LoaderParams[1],
) {
  const callback = this.async();
  const { resourcePath } = this;
  const { importMap, renderer, NavitaDependency, outputCss } = this.getOptions();

  // Bail as early as we can.
  if (
    this._module.matchResource ||
    !importMap.map((x) => x.source).some(
      (value) => content.indexOf(value) !== -1
    )) {
    renderer.clearCache(resourcePath);
    return callback(null, content, sourceMap);
  }

  try {
    const { result, dependencies, usedIds, sourceMap } = await renderer.transformAndProcess({
      content,
      filePath: resourcePath,
    });

    for (const dependency of dependencies) {
      this.addDependency(dependency);
    }

    const contents = [result];

    if (outputCss) {
      const hash = createHashFunction(this._compilation)(
        JSON.stringify(usedIds)
      );

      this._module.addDependency(new NavitaDependency(this.resourcePath, hash));

      if (this.hot) {
        const hmr = require.resolve("@navita/webpack-plugin/hmr/css");
        const { RuntimeGlobals } = this._compiler.webpack;

        contents.push(`
          if (${RuntimeGlobals.require}.navitaDevHash) {
            import(/* webpackMode: "lazy-once" */"${hmr}").then(({ css }) => css());
          } 
        `);
      }
    }

    callback(
      null,
      contents.filter(Boolean).join('\n').trim(),
      sourceMap,
    );
  } catch (error) {
    callback(error as Error);
  }

  return undefined;
}
