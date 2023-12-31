import nodeResolve from "@rollup/plugin-node-resolve";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import externals from "rollup-plugin-node-externals";

export async function createDeclaration({ outDir, packagePath, input }: {
  outDir: string;
  packagePath: string;
  input: Set<string>;
}) {
  const types = await rollup({
    input: [...input],
    plugins: [
      externals({ packagePath }),
      nodeResolve({ extensions: [".ts"] }),
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
