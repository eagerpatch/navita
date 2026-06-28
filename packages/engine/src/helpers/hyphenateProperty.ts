// Modified from
// https://github.com/styletron/styletron/blob/b552ddc5050a8cc5eec84a46a299d937d3bb0112/packages/styletron-engine-atomic/src/hyphenate-style-name.ts
const uppercasePattern = /[A-Z]/g;
const msPattern = /^ms-/;
const cssVarPattern = /^--/;
const cache = {};

export function hyphenateProperty(property: string): string {
  if (cssVarPattern.test(property)) {
    return property;
  }

  if (property in cache) {
    return cache[property];
  }

  const hyphenated = property
    .replace(uppercasePattern, "-$&")
    .toLowerCase()
    .replace(msPattern, "-ms-");

  cache[property] = hyphenated;

  return hyphenated;
}
