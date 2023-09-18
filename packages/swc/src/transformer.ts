import type { ImportMap } from "@navita/types";
import { transform } from "@swc/core";
import { defaultCompressOptions } from "./utils/defaultCompressOptions";
import { findAndCreateCacheDir } from "./utils/findAndCreateCacheDir";

type Options = {
  filename: string;
  importMap: ImportMap;
};

export async function transformer(
  code: string,
  { filename, importMap = [] }: Options
) {
  return transform(code, {
    filename,
    swcrc: false,
    sourceMaps: false,
    jsc: {
      target: "es2022",
      transform: {
        react: {
          runtime: 'automatic',
        },
        optimizer: {
          // This exists, but it's not in the types
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          simplify: {
            preserveImportsWithSideEffects: false
          },
        }
      },
      parser: {
        syntax: "typescript",
        tsx: true,
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
        plugins: [
          [require.resolve('@navita/swc/_transformer.wasm'), {
            importMap,
          }],
        ],
      },
    },
  }).then((result) => result.code);
}
