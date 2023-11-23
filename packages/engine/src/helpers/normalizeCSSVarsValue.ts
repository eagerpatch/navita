const cssVarRegex = /(?<!var\()(\s*)(--[a-zA-Z0-9_-]+)/g;

export function normalizeCSSVarsValue(value: string) {
  if (value.includes('--')) {
    return value.replace(cssVarRegex, "$1var($2)");
  }

  return value;
}
