import * as path from "path";
import { glob } from "fast-glob";
import type { PackageJson } from "type-fest";
import { clean } from "./clean";
import { copyFiles } from "./copyFiles";
import { createDeclaration } from "./createDeclaration";
import { createPackageJson as createPackageJsonString } from "./createPackageJson";
import { extractPathsFromExports } from "./extractPathsFromExports";
import { transpile } from "./transpile";
import { checkFileExists } from "./checkFileExists";

const isDevMode = process.argv.includes("--dev");
const cwd = process.cwd();

async function main() {
  const packagePath = path.resolve(cwd, "package.json");
  const packageJson = require(packagePath) as PackageJson;

  if (!packageJson.exports) {
    throw new Error("Field \"exports\" is missing in package.json");
  }

  const sourceDir = path.resolve(cwd, "src");
  const outDir = path.resolve(cwd, "dist");

  // Always clean
  await clean(outDir);

  // Grab all the files in the source directory.
  const input = new Set(await glob("**/*.{ts,tsx}", { cwd: sourceDir, absolute: true }));

  // Files in exports
  const files = extractPathsFromExports(packageJson.exports).map((file) => path.resolve(cwd, file));

  const isEsm = files.find((file) => file.endsWith(".mjs"));
  const isCjs = files.find((file) => file.endsWith(".cjs"));

  const promises: Promise<unknown>[] = [];
  const excludedFiles = ['package.json'];

  promises.push(
    copyFiles([
      {
        from: await checkFileExists("./README.md") ? "./README.md" : '../../README.md',
        to: path.resolve(outDir, "README.md")
      },
      ...files
        .filter((file) => !file.match(/\.([cm])?js|ts$/))
        .map((file) => path.relative(cwd, file))
        .filter((file) => !excludedFiles.includes(file))
        .map((file) => ({
          from: file,
          to: path.resolve(outDir, file),
        }))
    ])
  );

  const transpileConfig = {
    outDir,
    packagePath,
    devMode: isDevMode,
  }

  if (isEsm) {
    promises.push(
      transpile({
        ...transpileConfig,
        format: 'esm',
        extension: '.mjs',
        input,
      })
    );
  }

  if (isCjs) {
    promises.push(
      transpile({
        ...transpileConfig,
        format: 'cjs',
        extension: '.cjs',
        input
      })
    );
  }

  if (!isDevMode) {
    const exportedTypes = files.filter((file) => file.endsWith(".ts"));

    promises.push(
      createDeclaration({ outDir, packagePath, input: new Set(exportedTypes) }),
    );
  }

  console.log(`Building ${packageJson.name}.`);

  return Promise.all(promises.filter(Boolean)).then(() => createPackageJsonString(outDir, packageJson));
}

main().then(() => {
  console.log("Done!");
}).catch((error) => {
  throw error;
});
