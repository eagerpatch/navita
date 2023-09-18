export function generateCombinedAtRules(
  currentMediaQuery: string,
  nestedMediaQuery: string
) {
  if (currentMediaQuery.length === 0) {
    return nestedMediaQuery;
  }

  return `${currentMediaQuery} and ${nestedMediaQuery}`;
}
