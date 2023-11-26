import * as fs from "fs";
import * as path from "path";

export async function copyFiles(files: { from: string; to: string }[]) {
  const promises: Promise<unknown>[] = [];

  for (const { from, to } of files) {
    promises.push(
      fs.promises
        .mkdir(path.dirname(to), { recursive: true })
        .then(() => fs.promises.copyFile(from, to, fs.constants.COPYFILE_EXCL))
        .catch(() => undefined)
    );
  }

  return Promise.all(promises);
}
