export function isObject(val: unknown) {
  return val != null && typeof val === "object" && Array.isArray(val) === false;
}
