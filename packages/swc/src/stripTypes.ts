import { getTransform } from "./loadOxc";

/**
 * Strip TypeScript types (and transform JSX) from a module, leaving an ES
 * module of plain JavaScript. Module syntax (import/export) is preserved.
 */
export function stripTypes(filename: string, code: string): string {
  // Keep modern syntax; we only want type erasure + JSX, not down-leveling.
  const result = getTransform().transformSync(filename, code, {});
  return result.code;
}
