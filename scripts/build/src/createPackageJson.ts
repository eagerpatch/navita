import type { PackageJson } from "type-fest";

export function createPackageJson(pkg: PackageJson): string {
  const { scripts, devDependencies, publishConfig, files, ...rest } = pkg;

  return JSON.stringify({
    ...rest,
    exports: removeDirectoryFromValues(rest.exports),
  }, null, 2);
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
