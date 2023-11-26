import * as fs from "fs";

export function checkFileExists(file: string) {
  return fs.promises.access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}
