import * as fs from "node:fs";
import * as path from "node:path";

type Exports = Record<string, unknown> | string | null | undefined;

/**
 * Port of scripts/build/src/createPackageJson.ts (the custom tool's
 * "publish-from-dist" step). tsdown does NOT do this, so we run it from the
 * `build:done` hook. It:
 *  - strips scripts / devDependencies / publishConfig / files
 *  - rewrites every exports value: /dist/ -> /, /src/ -> /, .ts -> .d.ts
 *  - writes the result to <outDir>/package.json
 */
export async function createPackageJson(cwd: string, outDir = "dist") {
  const pkgPath = path.resolve(cwd, "package.json");
  const outPath = path.resolve(cwd, outDir, "package.json");

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const { scripts, devDependencies, publishConfig, files, ...rest } = pkg;

  const content = JSON.stringify(
    {
      ...rest,
      exports: removeDirectoryFromValues(rest.exports),
    },
    null,
    2,
  );

  await fs.promises.writeFile(outPath, content);
}

function removeDirectoryFromValues(obj: Exports): Exports {
  if (typeof obj !== "object" || obj === null) return obj;

  const updated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      updated[key] = removeDirectoryFromValues(value as Exports);
    } else if (typeof value === "string") {
      let updatedValue = value.replace(/\/(dist|src)\//, "/");
      updatedValue = updatedValue.replace(/\.ts$/, ".d.ts");
      updated[key] = updatedValue;
    } else {
      updated[key] = value;
    }
  }

  return updated;
}
