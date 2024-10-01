import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import type { OutputOptions, RollupOptions} from "rollup";
import { rollup, watch } from "rollup";
// import multiInput from "rollup-plugin-multi-input";
import externals from "rollup-plugin-node-externals";
import { swc } from "rollup-plugin-swc3";
import { esmShim } from "./plugins/esmShim";

export async function transpile({ input, format, extension, outDir, packagePath, devMode }: {
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
      preserveModules: true,
      entryFileNames: `[name]${extension}`,
      chunkFileNames: `[name]${extension}`,
    }],
    plugins: [
      // multiInput({ relative: "src" }),
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
