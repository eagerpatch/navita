import type { IdentifierGenerator } from "./types";

export class Cache<T> {
  private _items: Record<string, T & { id: string | number }> = {};

  constructor(private _idGenerator: IdentifierGenerator<T>) {}

  getOrStore(value: Omit<T, "id">) {
    const cacheKey = JSON.stringify(value);

    if (this._items[cacheKey]) {
      return this._items[cacheKey];
    }

    const item = {
      id: this._idGenerator.next(value as T),
      ...value,
    } as T & { id: string | number };

    this._items[cacheKey] = item;

    return item;
  }

  public items(ids: (string | number)[] = undefined) {
    const items = Object.values(this._items);

    if (ids === undefined) {
      return items;
    }

    const idSet = new Set(ids);

    return items.filter((item) => idSet.has(item.id));
  }
}
