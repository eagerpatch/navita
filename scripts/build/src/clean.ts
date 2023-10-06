import * as fs from "fs";
import { rimraf } from "rimraf";

export async function clean(outDir: string) {
  return rimraf(outDir).then(() => fs.promises.mkdir(outDir));
}
