type Primitive = string | number | null | undefined;

type Walkable = {
  [Key in string | number]: Primitive | Walkable;
};

export function walkObject<T extends Walkable, MapTo>(
  objectToWalk: T,
  transformFn: (value: Primitive, path: Array<string>) => MapTo,
  currentPath: Array<string> = [],
) {
  const clonedObject = objectToWalk.constructor();

  for (const key in objectToWalk) {
    const value = objectToWalk[key];
    const newPath = [...currentPath, key];

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      value == null
    ) {
      clonedObject[key] = transformFn(value as Primitive, newPath);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      clonedObject[key] = walkObject(value as Walkable, transformFn, newPath);
    }
  }

  return clonedObject;
}
