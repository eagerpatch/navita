import fs from "fs";
import { resolve } from "node:path";
import type { IdentifierGenerator } from "./types";

function createPersist(cachePath?: string) {
  if (!cachePath) {
    return undefined;
  }

  // Todo: fix this...
  fs.mkdirSync(resolve(cachePath, '..'), { recursive: true });

  return (data: string, id: string | number) => new Promise<void>((resolve, reject) => {
    const stream = fs.createWriteStream(cachePath, { flags: 'a' });

    // Add "id" to the JSON data without parsing it.
    const newData = `{"id":${JSON.stringify(id)},${data.substring(1)}` + "\n";

    stream.write(newData, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
      stream.end();
    });

    // It's also important to handle the 'error' event on the stream
    // to catch any errors that occur during the stream operations.
    stream.on('error', reject);
  });
}

export function createCache<T>(
  name: string,
  IdGenerator: new () => IdentifierGenerator<T>,
  cacheDirectory?: string,
) {
  const idGenerator = new IdGenerator();
  const cachePath = cacheDirectory ? resolve(`${cacheDirectory}/${name}.txt`) : undefined;

  // Todo: ensure that the directory exists if we have a cacheDirectory.
  const items: Record<string, T & { id: string | number }> = {};

  const persist = createPersist(cachePath);

  if (cachePath) {
    try {
      const data = fs.readFileSync(cachePath, 'utf8');
      const lines = data.split('\n');

      for (const line of lines) {
        if (!line) {
          continue;
        }

        const { id, ...rest } = JSON.parse(line);

        // We'll use the id-generator the same way we did when we first created the cache.
        idGenerator.next(rest as T);

        items[JSON.stringify(rest)] = {
          id,
          ...rest,
        };
      }
    } catch (e) {

    }
  }

  return {
    async getOrStore(value: Omit<T, 'id'>) {
      const cacheKey = JSON.stringify(value);

      if (items[cacheKey]) {
        return items[cacheKey];
      }

      const cached = items[cacheKey] = {
        id: idGenerator.next(value as T),
        ...value,
      } as T & { id: string | number };

      if (persist) {
        await persist(cacheKey, cached.id);
      }

      return cached;
    },
    items(ids?: (string | number)[]) {
      const result = Object.values(items);

      if (ids === undefined) {
        return result;
      }

      return result.filter((item) => ids.includes(item.id));
    }
  }
}

export type Cache<T> = ReturnType<typeof createCache<T>>;
