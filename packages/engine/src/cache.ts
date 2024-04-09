import fs from "fs";
import { resolve } from "node:path";
import type { IdentifierGenerator } from "./types";

async function createHydrate() {
  // Do stuff
}

function createPersist(cachePath?: string) {
  if (!cachePath) {
    return undefined;
  }

  const stream = fs.createWriteStream(cachePath, { flags: 'a' });

  return (data: string, id: string | number) => new Promise<void>((resolve, reject) => {
    // Add "id" to the JSON data without parsing it.
    const newData = `{"id":${JSON.stringify(id)},${data.substring(1)}` + "\n";

    stream.write(newData, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });

    // It's also important to handle the 'error' event on the stream
    // to catch any errors that occur during the stream operations.
    stream.on('error', reject);
  });
}

export async function createCache<T>(
  name: string,
  IdGenerator: new () => IdentifierGenerator<T>,
  cacheDirectory?: string,
) {
  const idGenerator = new IdGenerator();
  const cachePath = cacheDirectory ? resolve(`${cacheDirectory}/${name}.txt`) : undefined;

  // Todo: ensure that the directory exists.
  const items: Record<string, T & { id: string | number }> = {};

  const persist = createPersist(cachePath);

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
