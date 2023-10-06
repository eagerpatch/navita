import type { PackageJson } from "type-fest";

export function extractPathsFromExports(exports: PackageJson.Exports, paths: string[] = []) {
  if (typeof exports === 'string') {
    paths.push(exports);
  } else if (typeof exports === 'object' && exports !== null) {
    for (const subField of Object.values(exports)) {
      extractPathsFromExports(subField, paths)
    }
  }

  return paths;
}
