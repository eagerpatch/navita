import * as fs from "fs";
import path from "path";
import type { PackageJson } from "type-fest";

export async function getPackageInfo() {
  const content = await fs.promises.readFile(
    path.join(__dirname, "..", "..", "package.json")
  );

  return JSON.parse(content.toString()) as PackageJson;
}
