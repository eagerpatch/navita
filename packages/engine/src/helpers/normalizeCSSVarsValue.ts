// Matches a "naked" CSS custom-property reference (`--foo`) that should be
// wrapped in `var(...)`. To avoid corrupting arbitrary strings that merely
// contain `--` (e.g. a font family like `Foo--Bar`), the `--` must sit at a
// token boundary:
//   - not already wrapped by `var(`  -> (?<!var\()
//   - not preceded by an identifier character (letter/digit) -> (?<![A-Za-z0-9])
const cssVarRegex = /(?<!var\()(?<![A-Za-z0-9])(--[a-zA-Z0-9_-]+)/g;

export function normalizeCSSVarsValue(value: string) {
  if (value.includes("--")) {
    return value.replace(cssVarRegex, "var($1)");
  }

  return value;
}
