import * as fs from "fs";
import * as path from "path";
import type { PackageJson } from "type-fest";

export async function createPackageJson(outDir: string, pkg: PackageJson) {
  const { scripts, devDependencies, publishConfig, files, ...rest } = pkg;

  const content = JSON.stringify({
    ...rest,
    exports: removeDirectoryFromValues(rest.exports),
  }, null, 2);

  return fs.promises.writeFile(path.resolve(outDir, 'package.json'), content)
}

function removeDirectoryFromValues(obj: PackageJson['exports']) {
  const updatedObj: PackageJson['exports'] = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      updatedObj[key] = removeDirectoryFromValues(value);
    } else if (typeof value === 'string') {
      let updatedValue = value.replace(/\/(dist|src)\//, '/');
      updatedValue = updatedValue.replace(/\.ts$/, '.d.ts');
      updatedObj[key] = updatedValue;
    } else {
      updatedObj[key] = value;
    }
  }

  return updatedObj;
}
