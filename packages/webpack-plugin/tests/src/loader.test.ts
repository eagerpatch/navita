import type { ImportMap } from '@navita/core/createRenderer';
import { AsyncSeriesHook, SyncHook } from "tapable";
import type { LoaderContext } from 'webpack';
import loader from '../../src/loader';

describe('loader.tests.ts', () => {
  let callback: jest.Mock;

  let doneHook: AsyncSeriesHook<void>;
  let watchCloseHook: SyncHook<void>;

  beforeEach(() => {
    callback = jest.fn();
    doneHook = new AsyncSeriesHook();
    watchCloseHook = new SyncHook();
  });

  const createLoaderContext = (options: { importMap?: ImportMap, fileName?: string, watchMode?: boolean, } = {}) => {
    return ({
      async: () => callback,
      cacheable: () => undefined,
      getOptions: () => ({
        importMap: [...(options.importMap || [])],
        renderer: undefined,
      }),
      resourcePath: options.fileName || undefined,
      _module: {
        matchResource: '',
        resource: options.fileName || undefined,
      },
      _compilation: {
        moduleGraph: {
          getIssuer: () => null,
        },
      },
      _compiler: {
        inputFileSystem: {},
        watchMode: !!options.watchMode,
        hooks: {
          done: doneHook,
          watchClose: watchCloseHook,
        },
      },
    } as unknown as LoaderContext<unknown>);
  };

  it('should bail if matchResource', async () => {
    const input = '// this is the input';
    const sourceMap = '// this is the sourcemap';

    const context = createLoaderContext();
    context._module.matchResource = 'something';

    await loader.call(context, input, sourceMap);
    expect(callback).toHaveBeenCalledWith(null, input, sourceMap);
  });

  it('should bail if no callExpressions', async () => {
    const input = '// this is the input';
    const sourceMap = '// this is the sourcemap';

    await loader.call(createLoaderContext(), input, sourceMap);
    expect(callback).toHaveBeenCalledWith(null, input, sourceMap);
  });

  it('should bail if no import found', async () => {
    const input = `
      import { something } from "something";
      something();
    `;
    const sourceMap = '// this is the sourcemap';

    await loader.call(createLoaderContext(), input, sourceMap);
    expect(callback).toHaveBeenCalledWith(null, input, sourceMap);
  });

  it('should callback with errors on errors', async () => {
    const input = `
      import { valid } from "valid";
      valid();
      
      this is the input
    `;
    await loader.call(
      createLoaderContext({
        importMap: [
          {
            source: 'valid',
            callee: 'valid',
          },
        ],
      }),
      input,
      ''
    );

    expect(callback).toHaveBeenCalledWith(expect.objectContaining(new Error()));

    await doneHook.promise();
  });
});
