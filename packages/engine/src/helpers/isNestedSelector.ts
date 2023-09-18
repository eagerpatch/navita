const regex = /^([:\[>&])/

export function isNestedSelector(property) {
  return regex.test(property);
}
