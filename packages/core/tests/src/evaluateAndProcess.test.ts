import * as fs from 'fs';
import path from 'path';
import {
  collectResult,
  generateIdentifier,
  setAdapter,
  addCss,
  addFontFace,
  addKeyframe,
  addStaticCss,
} from '@navita/adapter';
import { ClassList, Engine, Static } from '@navita/engine';
import type { Caches } from '../../src/evaluateAndProcess';
import { evaluateAndProcess } from '../../src/evaluateAndProcess';

describe('evaluateAndProcess', () => {
  let engine: Engine;
  let readFile: jest.Mock;
  let moduleCache: Caches['moduleCache'];
  let resolverCache: Caches['resolverCache'];
  let nodeModuleCache: Caches['nodeModuleCache'];

  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    engine = new Engine();
    readFile = jest.fn();
    moduleCache = new Map();
    resolverCache = {};
    nodeModuleCache = {};
    setAdapter(undefined);
  });

  // We'll set a basePath that doesn't force us into isExternal
  const fakedBasePath = path.resolve(
    __dirname,
    '../../../../'
  );

  const toFilePath = (fileName: string) =>
    path.resolve(fakedBasePath, fileName);

  function createEvaluateAndProcess(
    options: {
      basePath?: string;
      files?: Record<string, string>;
      resolver?: (filePath: string, request: string) => Promise<string>;
    } = {},
  ) {
    const { basePath = fakedBasePath, resolver } = options || {};

    const files = Object.entries(options.files || {}).reduce(
      (acc, [fileName, content]) => ({
        ...acc,
        [path.resolve(basePath, fileName)]: content,
      }),
      {} as Record<string, string>,
    );

    const [filePath] = Object.keys(files || {});
    const source = files?.[filePath] || '';

    return evaluateAndProcess({
      type: 'entryPoint',
      filePath: path.resolve(basePath, filePath || ''),
      source,
      engine,
      moduleCache,
      resolverCache,
      nodeModuleCache,
      importMap: [
        {
          source: '@navita/css',
          callee: 'style',
        },
        {
          source: '@navita/css',
          callee: 'createGlobalTheme',
        },
      ],
      readFile: async (filePath: string) => {
        const result =
          files[filePath] || (await fs.promises.readFile(filePath, 'utf-8'));

        // Call our mock
        readFile(result);

        return result;
      },
      resolver: async (filePath, request) => {
        if (resolver) {
          const resolved = path.resolve(
            basePath,
            await resolver(filePath, request),
          );

          if (files[resolved]) {
            return resolved;
          }
        }

        const adjustedRequest = path.resolve(
          basePath,
          request.replace(/^\.\//, ''),
        );

        if (files[adjustedRequest]) {
          return adjustedRequest;
        }

        return require.resolve(request);
      },
    });
  }

  it('should be defined', async () => {
    const result = await createEvaluateAndProcess();

    expect(result).toBeDefined();
    expect(result.result).toEqual(`const $$evaluatedValues = [];`);
    expect(result.dependencies).toEqual([]);
  }, 10000);

  it('should transform source', async () => {
    const { result, dependencies } = await createEvaluateAndProcess({
      files: {
        'index.ts': `
          import { style } from '@navita/css';
          const a = style({
            color: 'red',
          });
        `,
      },
    });

    expect(result).toEqual('const $$evaluatedValues = ["a1"];');
    expect(dependencies).toEqual([]);
    expect(engine.renderCssToString()).toMatchInlineSnapshot(`".a1{color:red}"`);
  }, 10000);

  it('set the adapter', async () => {
    setAdapter(undefined);

    // This sets the adapter (should we clear it? - hmm)
    await createEvaluateAndProcess();

    expect(generateIdentifier('anything')).toEqual('_a');
    // noinspection JSVoidFunctionReturnValueUsed
    expect(addStaticCss('.foo', {})).toBeInstanceOf(Static);

    const css = addCss({ color: 'red' });
    expect(css).toBeInstanceOf(ClassList);
    expect(css.toString()).toEqual('a1');
    expect(
      addKeyframe({ from: { color: 'red' }, to: { color: 'blue' } }),
    ).toEqual('a');
    expect(addFontFace({ src: 'bar' })).toEqual('a');
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      addFontFace({ fontFamily: 'bar' });
    }).toThrow(
      `This function creates and returns a font-family name, so the "fontFamily" property should not be provided.`,
    );

    engine.clearUsedIds = jest.fn();
    engine.setFilePath = jest.fn();

    const result = collectResult({
      filePath: 'cool-filePath',
      result: () => 'something',
      index: 0,
      identifier: 'something',
      position: [0, 0],
      sourceMap: {
        line: 0,
        column: 0,
      }
    });

    expect(result).toEqual('something');
    expect(engine.clearUsedIds).toHaveBeenCalledWith('cool-filePath');
    expect(engine.setFilePath).toHaveBeenNthCalledWith(1, 'cool-filePath');
    expect(engine.setFilePath).toHaveBeenNthCalledWith(2, undefined);
    expect(engine.setFilePath).toHaveBeenCalledTimes(2);
  });

  it('should work with a dependency', async () => {
    const { result, dependencies } = await createEvaluateAndProcess({
      resolver: async (_, request) => request.replace('~/', '') + '.ts',
      files: {
        'index.ts': `
          import { style } from '@navita/css';
          import { background } from '~/colors';
          const a = style({
            color: 'red',
            background,
          });
        `,
        'colors.ts': `
          export const background = 'red'; 
        `,
      },
    });

    expect(dependencies).toHaveLength(1);
    expect(dependencies[0].endsWith('colors.ts')).toBe(true);
    expect(result).toBe('const $$evaluatedValues = ["a1 b1"];');
    expect(engine.renderCssToString()).toMatchInlineSnapshot(
      `".a1{color:red}.b1{background:red}"`,
    );
  });

  it('ignores errors in resolver and tries with enhanced-resolve', async () => {
    const { result, dependencies } = await createEvaluateAndProcess({
      files: {
        'index.ts': `
          import { style } from '@navita/css';
          const a = style({ color: 'red' });
          const b = style({ color: 'blue' });
        `,
      },
      resolver: async () => {
        throw new Error('Resolver error');
      },
    });

    expect(dependencies).toHaveLength(0);
    expect(dependencies).toEqual([]);
    expect(result).toBe('const $$evaluatedValues = ["a1","a2"];');
    expect(engine.renderCssToString()).toMatchInlineSnapshot(
      `".a1{color:red}.a2{color:blue}"`,
    );
  });

  it('populates the resolverCache and nodeModuleCache', async () => {
    const { result, dependencies } = await createEvaluateAndProcess({
      resolver: async (_, request) => request.replace('~/', '') + '.ts',
      files: {
        'index.ts': `
          import { style } from '@navita/css';
          import { vars } from '~/theme';
          const a = style({ color: vars.color });
        `,
        'theme.ts': `
          import { createGlobalTheme } from '@navita/css';
          export const vars = createGlobalTheme(":root", {
            color: "red",
          });
        `,
      },
    });

    const entry = resolverCache[fakedBasePath];

    expect(entry).toBeDefined();
    expect(Object.keys(entry)).toEqual([
      '@navita/adapter',
      '@navita/css',
      '~/theme',
    ]);
    expect(dependencies).toHaveLength(1);
    expect(Object.keys(nodeModuleCache)).toHaveLength(2);
    expect(result).toBe('const $$evaluatedValues = ["a1"];');
    expect(engine.renderCssToString()).toMatchInlineSnapshot(`".a1{color:var(--color)}"`);
  });

  it('uses the moduleCache', async () => {
    const files: Record<string, string> = {
      'index.ts': `
        import { style } from '@navita/css';
        import { vars } from './theme.ts';
        const a = style({ color: vars.color });
      `,
      'theme.ts': `
        import { createGlobalTheme } from '@navita/css';
        export const vars = createGlobalTheme(":root", {
          color: "red",
        });
      `,
    };

    const hasSpy = jest.spyOn(moduleCache, 'has');
    const getSpy = jest.spyOn(moduleCache, 'get');
    const setSpy = jest.spyOn(moduleCache, 'set');

    expect(moduleCache).toEqual(new Map());

    // Prime the cache first
    await createEvaluateAndProcess({ files });

    // First it checks for cache
    expect(hasSpy).toHaveBeenCalledTimes(2);
    expect(hasSpy).toHaveBeenNthCalledWith(1, toFilePath('index.ts') + ':entryPoint');
    expect(hasSpy).toHaveBeenNthCalledWith(2, toFilePath('theme.ts') + ':dependency');

    // Then it sets the cache
    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenNthCalledWith(
      1,
      toFilePath('index.ts') + ':entryPoint',
      expect.objectContaining({
        source: expect.anything(),
        compiledFn: expect.anything(),
      }),
    );
    expect(setSpy).toHaveBeenNthCalledWith(
      2,
      toFilePath('theme.ts') + ':dependency',
      expect.objectContaining({
        source: expect.anything(),
        compiledFn: expect.anything(),
      }),
    );

    // Reset the spies
    hasSpy.mockClear();
    getSpy.mockClear();
    setSpy.mockClear();

    // On the second run, it should use the cache
    await createEvaluateAndProcess({ files });

    expect(setSpy).not.toHaveBeenCalled();
    expect(hasSpy).toHaveBeenCalledTimes(2);
    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(getSpy).toHaveBeenNthCalledWith(1, toFilePath('index.ts') + ':entryPoint');
    expect(getSpy).toHaveBeenNthCalledWith(2, toFilePath('theme.ts') + ':dependency');
  });

  it('ignores dependencies that are not "source" files', async () => {
    const { dependencies } = await createEvaluateAndProcess({
      files: {
        'index.ts': `
          import { style } from '@navita/css';
          import * as cssModule from './styles.module.css';
          const a = style({ color: 'red' });
          // Fake usage here:
          cssModule;
        `,
        'styles.module.css': `.a { color: red; }`,
      },
    });

    expect(readFile).not.toHaveBeenCalled();
    expect(dependencies).toHaveLength(0);
  });

  it('should throw if we cannot resolve a dependency', async () => {
    try {
      await createEvaluateAndProcess({
        files: {
          'index.ts': `
            import { style } from '@navita/css';
            import { background } from '~/colors';
            const a = style({ background });
          `,
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message.startsWith('Failed to resolve dependency "~/colors" in ')).toBe(true);
    }
  });
});
