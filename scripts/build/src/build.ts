import * as fs from "fs";
import * as path from "path";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { glob } from "fast-glob";
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

async function createDeclaration({ outDir, packagePath, input }: {
  outDir: string;
  packagePath: string;
  input: Set<string>;
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
  await clean({ outDir });

  // Input
  const input = new Set(await glob("src/**/*.{ts,tsx}", { cwd, absolute: true }));

  const copy = [
    ...(packageJson.buildConfig.copy || []).map((file: string) => ({
      from: path.resolve(cwd, file),
      to: path.resolve(outDir, file),
    })),
    {
      from: "../../README.md",
      to: "README.md"
    },
  ];

  const promises: Promise<unknown>[] = [];

  for (const { from, to } of copy) {
    console.log({
      src: from,
      dest: to,
    });
  }

  const transpileConfig = {
    outDir,
    packagePath,
    devMode: isDevMode,
  }

  promises.push(
    transpile({
      ...transpileConfig,
      format: 'esm',
      extension: '.mjs',
      input,
    })
  );

  promises.push(
    transpile({
      ...transpileConfig,
      format: 'cjs',
      extension: '.js',
      input
    })
  );

  if (!isDevMode) {
    promises.push(
      createDeclaration({ outDir, packagePath, input }),
      createPackageJson({ outDir }, createPackageJsonString(packageJson)),
    );
  }

  console.log(`Building ${packageJson.name}.`);

  return Promise.all(promises.filter(Boolean));
}

main().catch((error) => {
  throw error;
});
