import path from "path";
import type { Compiler, Module } from "webpack";

export const NAVITA_MODULE_TYPE = "css/navita";

type ModuleProperties = {
  issuerPath: string;
  cssHash: string;
};

// All of this is very verbose due to the way webpacks types are defined. Would love to find a fix!
export type NavitaModule = new (issuerPath: string, cssHash: string) => Module & ModuleProperties;
export type NavitaModuleInstance = InstanceType<NavitaModule>;
const cache = new Map<Compiler['webpack'], NavitaModule>();

type ObjectToAssign<T> = (values: { issuerPath: string; cssHash: string }) => T;

function createNavitaModule(webpack: Compiler['webpack'], objectToAssign: ObjectToAssign<unknown>) {
  const WebpackModule = (webpack.Module as unknown) as typeof Module;

  class NavitaModule extends WebpackModule {
    constructor(
      public readonly issuerPath: string,
      public readonly cssHash: string,
    ) {
      super(NAVITA_MODULE_TYPE);

      this.buildInfo = {
        cacheable: true,
        hash: cssHash,
      };

      if (objectToAssign) {
        // This is not type-safe, but we don't rely on this in the plugin
        // It's mainly for Next.js css-matching.
        Object.assign(this, objectToAssign({ issuerPath, cssHash }));
      }
    }

    identifier() {
      return `css/navita|${this.issuerPath}|${this.cssHash}`;
    }

    readableIdentifier(requestShortener) {
      return `navita ${requestShortener.shorten(this.issuerPath)} ${this.cssHash}`;
    }

    needBuild(_, callback) {
      callback(null, false);
    }

    size() {
      return 0;
    }

    serialize(context) {
      const { write } = context;
      write(this.issuerPath);
      write(this.cssHash);
      super.serialize(context);
    }
  }

  webpack.util.serialization.register(
    NavitaModule,
    path.resolve(__dirname, "NavitaModule"),
    null,
    {
      serialize(instance, context) {
        instance.serialize(context);
      },
      deserialize(context) {
        const { read } = context;

        const issuerPath = read();
        const cssHash = read();

        const dep = new NavitaModule(issuerPath, cssHash);

        dep.deserialize(context);

        return dep;
      },
    }
  );

  return NavitaModule;
}

export function getNavitaModule(webpack: Compiler['webpack'], objectToAssign?: ObjectToAssign<unknown>) {
  if (!cache.has(webpack)) {
    cache.set(webpack, createNavitaModule(webpack, objectToAssign));
  }

  return cache.get(webpack)!;
}
