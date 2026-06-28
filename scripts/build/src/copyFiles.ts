import * as fs from 'node:fs';
import * as path from 'node:path';

export async function copyFiles(files: { from: string; to: string }[]) {
  const promises: Promise<unknown>[] = [];

  for (const { from, to } of files) {
    promises.push(
      fs.promises
        .mkdir(path.dirname(to), { recursive: true })
        .then(() => fs.promises.copyFile(from, to)),
    );
  }

  return Promise.all(promises);
}
