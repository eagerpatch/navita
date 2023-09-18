const regex = /var\(([^,]+).*\)/;

export function normalizeCSSVarsProperty(property: string) {
  if (!property.startsWith('var(')) {
    return property;
  }

  const matches = property.match(regex);

  if (!matches) {
    return property;
  }

  return matches[1];
}
