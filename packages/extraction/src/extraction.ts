import type { ImportMap } from "@navita/types";
import { rewrite } from "./rewrite";
import { stripTypes } from "./stripTypes";
import { esmToAmd } from "./toAmd";

type Options = {
  filename: string;
  importMap?: ImportMap;
  entryPoint?: boolean;
};

/**
 * Transform a TypeScript/TSX module into an evaluatable AMD module for
 * `@navita/core`.
 *
 * For entry points, navita style calls are extracted into `collectResult(...)`
 * wrappers and the module is pruned to only what's needed to evaluate them.
 * For dependencies (`entryPoint: false`), the module is returned unchanged
 * except for TypeScript stripping and AMD wrapping.
 */
export async function extraction(
  code: string,
  { filename, importMap = [], entryPoint = true }: Options,
): Promise<string> {
  if (entryPoint === false) {
    const js = stripTypes(filename, code);
    return esmToAmd(js, { dropUnusedImports: false });
  }

  const rewritten = rewrite(code, { filename, importMap });
  const js = stripTypes(filename, rewritten);
  return esmToAmd(js, { dropUnusedImports: true });
}
