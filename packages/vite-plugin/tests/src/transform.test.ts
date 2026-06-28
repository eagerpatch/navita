import { createRenderer } from '@navita/core/createRenderer';
import { importMap } from '@navita/css';
import { type MockInstance, vi } from 'vitest';
import { navita } from '../../src/index';

/**
 * The navita transform must not re-process RedwoodSDK's already-built worker
 * bundle during its "linker" pass (signalled by RWSDK_BUILD_PASS=linker). That
 * bundle's styles are already extracted, and it imports runtime-only specifiers
 * (node:*, cloudflare:*, virtual:*) that navita can neither resolve nor evaluate
 * at build time — re-processing it crashes the build.
 *
 * These tests use a REAL renderer (createRenderer) and spy on its
 * transformAndProcess to assert whether the transform reaches extraction —
 * full extraction is exercised by @navita/core's own tests.
 */
describe('navita vite-plugin transform — RedwoodSDK linker pass', () => {
  const RENDERER_KEY = '__navita_renderer';
  // Code that references a navita import source, so the transform would otherwise
  // proceed to process it.
  const code = `import { style } from '@navita/css';\nexport const x = style({ color: 'red' });`;
  const id = '/project/dist/worker/index.js';

  let processSpy: MockInstance;

  beforeEach(() => {
    const renderer = createRenderer({
      context: process.cwd(),
      importMap,
      resolver: async () => null,
      readFile: async () => '',
    });
    processSpy = vi
      .spyOn(renderer, 'transformAndProcess')
      .mockResolvedValue({ result: code, sourceMap: null, dependencies: [] });
    (globalThis as Record<string, unknown>)[RENDERER_KEY] = renderer;
  });

  afterEach(() => {
    processSpy.mockRestore();
    delete (globalThis as Record<string, unknown>)[RENDERER_KEY];
    delete process.env.RWSDK_BUILD_PASS;
  });

  const getTransform = () => {
    const plugin = navita();
    // configResolved sets isProduction; production avoids the dev-only watch/HMR path.
    (plugin as { configResolved: (c: unknown) => void }).configResolved({
      root: process.cwd(),
      mode: 'production',
    });
    const { transform } = plugin as {
      transform: (this: unknown, code: string, id: string) => Promise<unknown>;
    };
    return (c: string, i: string) =>
      transform.call({ addWatchFile: vi.fn() }, c, i);
  };

  it('skips the built worker bundle during the rwsdk linker pass', async () => {
    process.env.RWSDK_BUILD_PASS = 'linker';

    const result = await getTransform()(code, id);

    expect(result).toBeNull();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it('processes the same file when NOT in the linker pass', async () => {
    delete process.env.RWSDK_BUILD_PASS;

    const result = (await getTransform()(code, id)) as { code: string } | null;

    // Without the linker gate the transform reaches extraction and returns a
    // result — proving it's the linker gate, not some other guard, doing the skip.
    expect(processSpy).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
  });
});
