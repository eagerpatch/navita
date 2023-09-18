import type { ImportMap } from "@navita/types";
import { transform } from "@swc/core";
import { defaultCompressOptions } from "./utils/defaultCompressOptions";
import { findAndCreateCacheDir } from "./utils/findAndCreateCacheDir";

type Options = {
  filename: string;
  importMap?: ImportMap;
  entryPoint?: boolean;
};

export async function extraction(
  code: string,
  { filename, importMap = [], entryPoint = true }: Options
) {
  return transform(code, {
    filename,
    swcrc: false,
    module: {
      type: "amd",
    },
    jsc: {
      target: "es2022",
      parser: {
        syntax: "typescript",
        tsx: true,
      },
      transform: {
        optimizer: {
          // This exists, but it's not in the types
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          simplify: {
            preserveImportsWithSideEffects: false
          },
        },
      },
      minify: {
        compress: {
          ...defaultCompressOptions,
          unused: true,
        },
        mangle: false
      },
      experimental: {
        cacheRoot: await findAndCreateCacheDir(),
        plugins: entryPoint === false ? [] : [
          [require.resolve('@navita/swc/_extraction.wasm'), {
            importMap,
          }],
        ],
      },
    },
  }).then((result) => result.code);
}
