import path from "path";
import type { Compiler, Dependency } from "webpack";

type DependencyProperties = {
  issuerPath: string;
  cssHash: string;
};

// All of this is very verbose due to the way webpacks types are defined. Would love to find a fix!
export type NavitaDependency = new (issuerPath: string, cssHash: string) => Dependency & DependencyProperties;
export type NavitaDependencyInstance = InstanceType<NavitaDependency>;

const cache = new WeakMap<Compiler['webpack'], NavitaDependency>();

function createNavitaDependency(webpack: Compiler['webpack']) {
  const WebpackDependency = (webpack.Dependency) as typeof Dependency;

  class NavitaDependency extends WebpackDependency {
    constructor(
      public readonly issuerPath: string,
      public readonly cssHash: string,
    ) {
      super();
    }

    get request() {
      return '.css';
    }

    getResourceIdentifier() {
      return `css-module-${this.issuerPath}-${this.cssHash}`;
    }

    getModuleEvaluationSideEffectsState(moduleGraph) {
      return moduleGraph.TRANSITIVE_ONLY;
    }

    serialize(context) {
      const { write } = context;

      write(this.issuerPath);
      write(this.cssHash);

      super.serialize(context);
    }
  }

  webpack.util.serialization.register(
    NavitaDependency,
    path.resolve(__dirname, "NavitaDependency"),
    null,
    {
      serialize(instance, context) {
        instance.serialize(context);
      },
      deserialize(context) {
        const { read } = context;
        const issuerPath = read();
        const cssHash = read();

        const dep = new NavitaDependency(
          issuerPath,
          cssHash,
        );

        dep.deserialize(context);

        return dep;
      },
    }
  );

  return NavitaDependency;
}

export function getNavitaDependency(webpack: Compiler['webpack']) {
  if (!cache.has(webpack)) {
    cache.set(webpack, createNavitaDependency(webpack));
  }

  return cache.get(webpack)!;
}
