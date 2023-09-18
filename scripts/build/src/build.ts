import * as fs from "fs";
import * as path from "path";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { globSync } from 'fast-glob';
import { rimraf } from "rimraf";
import type { OutputOptions, RollupOptions } from "rollup";
import { rollup, watch } from "rollup";
import dts from "rollup-plugin-dts";
import multiInput from "rollup-plugin-multi-input";
import externals from "rollup-plugin-node-externals";
import { swc } from "rollup-plugin-swc3";
import type { PackageJson } from "type-fest";
import { createPackageJson as createPackageJsonString } from "./createPackageJson";
import { esmShim } from "./plugins/esmShim";

// Todo: Clean up this file and make it smarter.
async function clean({ outDir }: { outDir: string }) {
  return rimraf(outDir).then(() => fs.promises.mkdir(outDir));
}

async function createDeclaration({ outDir, packagePath, types: input }: {
  outDir: string;
  packagePath: string;
  types: Set<string>;
}) {
  const types = await rollup({
    input: [...input],
    plugins: [
      externals({ packagePath }),
      dts({
        compilerOptions: {
          stripInternal: true,
        }
      })
    ]
  });

  return types.write({
    dir: outDir,
  });
}

async function transpile({ input, format, extension, outDir, packagePath, devMode }: {
  input: Set<string>;
  format: 'esm' | 'cjs';
  extension: string;
  outDir: string;
  packagePath: string;
  devMode: boolean;
}) {
  const rollupOptions: RollupOptions = {
    input: [...input],
    output: [{
      dir: outDir,
      format,
      entryFileNames: `[name]${extension}`,
      chunkFileNames: `[name]${extension}`,
    }],
    plugins: [
      multiInput({ relative: "src" }),
      externals({ packagePath }),
      nodeResolve({ extensions: [".ts"] }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(devMode ? 'development' : 'production'),
        }
      }),
      swc({
        tsconfig: false,
        jsc: {
          target: "es2022",
          externalHelpers: true
        }
      }),
      esmShim(),
    ]
  };

  if (devMode) {
    const watcher = watch(rollupOptions);

    watcher.on('event', event => {
      if (event.code === 'START') {
        console.log(`Building ${format}...`);
      } else if (event.code === 'END') {
        console.log(`Built ${format}!`);
      } else if (event.code === 'BUNDLE_END') {
        event.result.close();
      } else if (event.code === 'ERROR') {
        throw event.error;
      }
    });

    process.on('SIGINT', () => {
      watcher.close();
      process.exit(0);
    })

    return watcher;
  }

  const bundler = await rollup(rollupOptions);

  return Promise.all(
    (rollupOptions.output as OutputOptions[]).map(
      (output) => bundler.write(output)
    )
  );
}

async function createPackageJson({ outDir }: {
  outDir: string;
}, content: string) {
  return fs.promises.writeFile(path.resolve(outDir, 'package.json'), content);
}

async function copyFiles({ outDir, cwd }: {
  outDir: string;
  cwd: string;
}, files: string[]) {
  if (!files) {
    return;
  }

  return Promise.all(
    files.map(
      (file) => fs.promises.cp(
        path.resolve(cwd, file),
        // Hacky, but remove potential ./src from the path.
        path.resolve(outDir, file.replace(/^\.\/src\//, './')),
        { recursive: true }
      )
    )
  );
}

const isDevMode = process.argv.includes("--dev");
const cwd = process.cwd();

const isEsmTarget = (fileName: string) => fileName.endsWith('.mjs');
const isCjsTarget = (fileName: string) => fileName.endsWith('.js') || fileName.endsWith('.cjs');
const resolveAndReplaceExtension = (fileName: string, newExt: string) => (
  path.resolve(cwd, 'src', fileName.replace(/^\.\/dist\//, '').replace(/\.[^.]+$/, newExt))
);

async function main() {
  const packagePath = path.resolve(cwd, "package.json");
  const packageJson = require(packagePath) as PackageJson;

  if (!packageJson.exports) {
    throw new Error("Field \"exports\" is missing in package.json");
  }

  const types = new Set<string>();
  const cjs = new Set<string>();
  const esm = new Set<string>();
  const copy = new Set<string>([...packageJson.files || []]);

  let cjsExtension = '.js';

  for (const exportEntry of Object.values(packageJson.exports)) {
    if (typeof exportEntry === 'string') {
      continue;
    }

    const { types: exportTypes, ...rest } = exportEntry as Record<string, string>;

    if (exportTypes) {
      (exportTypes.includes('*') ?
        globSync(exportTypes, { cwd, absolute: true }) :
        [path.resolve(cwd, exportTypes)])
        .filter((x) => !x.endsWith('.json'))
        .forEach((x) => types.add(x));
    }

    for (const value of Object.values(rest)) {
      const isEsm = isEsmTarget(value);
      const isCjs = isCjsTarget(value);

      if (isEsm || isCjs) {
        const source = resolveAndReplaceExtension(value, '.ts');

        if (isEsm) {
          esm.add(source);
        }

        if (isCjs) {
          if (path.extname(value) === '.cjs') {
            cjsExtension = '.cjs';
          }

          cjs.add(source);
        }
      } else {
        // A copy needs to be relative to the cwd, not the package root.
        // Replace ./dist with ./src
        const source = value.replace(/^\.\/dist\//, './src/');
        copy.add(source);
      }
    }
  }

  const outDir = path.resolve(cwd, "dist");

  await clean({ outDir });

  const promises: Promise<unknown>[] = [
    copyFiles({ outDir, cwd }, [...copy]),
  ];

  const transpileConfig = {
    outDir,
    packagePath,
    devMode: isDevMode,
  }

  if (esm.size > 0) {
    promises.push(
      transpile({
        ...transpileConfig,
        format: 'esm',
        extension: '.mjs',
        input: esm
      })
    );
  }

  if (cjs.size > 0) {
    promises.push(
      transpile({
        ...transpileConfig,
        format: 'cjs',
        extension: cjsExtension,
        input: cjs
      })
    );
  }

  if (!isDevMode) {
    promises.push(
      fs.promises.cp(
        path.resolve(cwd, "../../README.md"),
        path.resolve(outDir, "README.md")
      ),
      createDeclaration({ outDir, packagePath, types }),
      createPackageJson({ outDir }, createPackageJsonString(packageJson)),
    );
  }

  console.log(`Building ${packageJson.name}.`);

  return Promise.all(promises.filter(Boolean));
}

main().catch((error) => {
  throw error;
});
