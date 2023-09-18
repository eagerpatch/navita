#!/usr/bin/env node

const { resolve } = require('path');
const { all: merge } = require('deepmerge');
const { sync: glob } = require('fast-glob');
const { run } = require('jest-cli');

function configFile(path) {
  return (() => {
    try {
      const file = require(path);

      if (path.endsWith('package.json')) {
        return file.jest;
      }

      return file;
    } catch {}
  })() || {};
}

const rootDir = resolve(__dirname, '../../../');
const cwd = process.cwd();

/**
 * Jests project-config is not working as intended (according to the documentation),
 * and it behaves differently depending on if you pass a config file or config JSON.
 *
 * This cli-forwarding solves this issue by passing the config as JSON, and
 * using a shared config file, that's overridable by local configs.
 *
 * @see https://github.com/jestjs/jest/issues/11411
 * @see https://github.com/jestjs/jest/issues/12230
 * @see https://github.com/jestjs/jest/issues/14199
 * @see https://github.com/jestjs/jest/issues/8241
 * @see https://github.com/jestjs/jest/issues/9628
 */
const config = {
  projects: glob([
    'packages/*',
    'examples/*',
  ], {
    cwd: rootDir,
    onlyDirectories: true,
    absolute: true,
  })
    .filter((path) => path.startsWith(cwd))
    .map((rootDir) => merge([
      {
        testEnvironment: 'node',
      },
      configFile(`${rootDir}/package.json`),
      configFile(`${rootDir}/jest.config.js`),
      {
        rootDir,
        prettierPath: require.resolve('prettier'),
        displayName: rootDir.split('/').slice(-2).join('/'),
        testMatch: [
          '**/*.test.[jt]s?(x)',
        ],
        coveragePathIgnorePatterns: [
          'dist/.*',
        ],
      }
    ])),

  transform: {
    '.+\\.(j|t|mj)sx?$': [require.resolve('babel-jest'), {
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: {
              node: 'current'
            }
          }
        ],
        require.resolve('@babel/preset-typescript'),
      ],
    }],
  },

  // We'll always ignore the package.json in the dist folder
  modulePathIgnorePatterns: [
    `<rootDir>/dist`,
  ],

  transformIgnorePatterns: [
    '/node_modules/',
  ],

  clearMocks: true,
};

process.argv.push('--config', JSON.stringify(config));
process.env.NODE_ENV = 'test';

run(process.argv.slice(2), process.cwd()).catch((error) => {
  throw error;
});
