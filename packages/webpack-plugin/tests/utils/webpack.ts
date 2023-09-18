import * as fs from 'fs';
import { CachedInputFileSystem } from 'enhanced-resolve';
import { createFsFromVolume, Volume } from 'memfs';
import { Union } from 'unionfs';
import type { IFS } from 'unionfs/lib/fs';
import type { Compiler, Configuration, RuleSetRule, Stats } from "webpack";
import { webpack } from 'webpack';

type Contents = string | { [path: string]: string };

interface Options {
  rules?: RuleSetRule[];
  plugins?: Configuration['plugins'];
  contents?: Contents;
}

// The idea was to have a real webpack compiler instance to run against the loaders,
// but something is not working with the unionfs and I don't have time to debug it.
// The loaders are tested with a faked context instead.
export const createWebpack = ({ rules, plugins, contents }: Options) => {
  const inputMemoryFileSystem = createFsFromVolume(new Volume());
  const combinedInputFileSystem = new Union().use(fs).use(inputMemoryFileSystem as unknown as IFS);

  const files: { [key: string]: string } = typeof contents === 'string' ? {
    '/index.js': contents
  } : contents || {};

  for (const [filePath, value] of Object.entries(files)) {
    inputMemoryFileSystem.writeFileSync(filePath, value || '');
  }

  const outputVolume = new Volume();
  const outputFileSystem = createFsFromVolume(outputVolume);

  const compiler = webpack({
    cache: false,
    target: 'node',
    mode: 'development',
    entry: './index.js',
    devtool: false,
    output: {
      path: '/dist',
      filename: 'index.js',
    },
    module: {
      rules: [
        ...rules || []
      ],
    },
    plugins: [
      {
        apply(compiler: Compiler) {
          compiler.inputFileSystem = (
            // Webpack overrides the inputFileSystem with a CachedInputFileSystem:
            // https://github.com/webpack/webpack/blob/c181294865dca01b28e6e316636fef5f2aad4eb6/lib/node/NodeEnvironmentPlugin.js#L44
            new CachedInputFileSystem(combinedInputFileSystem, 60000) as unknown as Compiler['inputFileSystem']
          );

          compiler.outputFileSystem = outputFileSystem;
        }
      },
      ...(plugins || [])
    ],
  });

  async function run() {
    const stats = await new Promise<Stats>((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          return reject(err);
        }

        if (!stats) {
          return reject(new Error('No stats'));
        }

        if (stats.hasErrors()) {
          return reject(stats.compilation.errors);
        }

        resolve(stats);
      });
    })

    const getStatsSource = (fileName: string) => (
      Array.from(stats.compilation.modules).find(
        (mod) => mod.nameForCondition() === fileName
      )?.originalSource()?.source()
    );

    const getCompiledSource = (fileName: string) => (
      outputVolume.readFileSync(fileName, 'utf-8')
    );

    return {
      stats,
      output:
      outputFileSystem,
      getStatsSource,
      getCompiledSource
    };
  }

  return [run, compiler] as const;
}
