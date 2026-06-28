import { defineConfig } from 'vitest/config';

// Each project's `root` is made absolute (resolved against this config file's
// directory) so it works no matter which directory `vitest` runs from — turbo
// invokes the `test` script inside each package.
const abs = (p: string) => new URL(p, import.meta.url).pathname;

// Shared test options. Vitest projects do NOT inherit the root `test` config, so
// these are spread into every project explicitly.
const shared = {
  globals: true,
  environment: 'node' as const,
  clearMocks: true,
  include: ['**/*.test.?(c|m)[jt]s?(x)'],
  exclude: ['**/dist/**', '**/node_modules/**'],
};

// [project name, project root]. The name doubles as the displayName and as the
// `--project <name>` filter each package's `test` script passes.
const packages: Array<[string, string]> = [
  ['@navita/adapter', 'packages/adapter'],
  ['@navita/core', 'packages/core'],
  ['@navita/css', 'packages/css'],
  ['@navita/engine', 'packages/engine'],
  ['@navita/jest', 'packages/jest'],
  ['@navita/next-plugin', 'packages/next-plugin'],
  ['@navita/swc', 'packages/swc'],
  ['@navita/vite-plugin', 'packages/vite-plugin'],
  ['@navita/webpack-plugin', 'packages/webpack-plugin'],
];

export default defineConfig({
  test: {
    ...shared,
    projects: [
      ...packages.map(([name, root]) => ({
        test: { ...shared, name, root: abs(root) },
      })),
      {
        test: {
          ...shared,
          name: 'navita-example-with-jest',
          root: abs('examples/with-jest'),
          setupFiles: ['@navita/jest'],
        },
      },
    ],
  },
});
