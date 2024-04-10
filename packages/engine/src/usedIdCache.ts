import { resolve } from "node:path";
import { caching } from "cache-manager";
import type { Engine } from "./index";

export async function createUsedIdCache<T>(
  engine: Engine,
  cacheDirectory?: string,
) {
  const usedIds: Record<string, any> = {};

  const memoryCache = await caching('memory');

  const ttl = 5 * 1000; /*milliseconds*/

  console.time('x');
  await memoryCache.set('foo', 'bar', ttl);
  const x = await memoryCache.get('foo');
  console.timeEnd('x');

  console.log('memoryCache', memoryCache);

  console.time('y');
  const y = await memoryCache.get('foo');
  console.timeEnd('y');

  console.log('y', y);

  const cachePath = cacheDirectory ? resolve(cacheDirectory, 'usedIds') : undefined;

  // https://github.com/npm/cacache

  return {
    async add(cache: string, value: T) {
      const x = memoryCache.set(cache, value, ttl);
    },
    get: (cache: string) => {

    },
  }
}

export type Cache<T> = ReturnType<typeof createUsedIdCache<T>>;
