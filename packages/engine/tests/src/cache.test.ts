import fs from "fs";
import { createCache } from "../../src/cache";
import { AlphaIDGenerator } from "../../src/identifiers/alphaIDGenerator";

describe('cache', () => {
  it('should use the cacheFactory instead', async () => {
    const cache = await createCache(
      'rule',
      AlphaIDGenerator,
      './temp/',
    );

    const item = await cache.getOrStore({ foo: 'bar' });

    const res = fs.readFileSync('./temp/rule.txt', 'utf8');

    console.log('res', res);

    console.log('item', item);

    expect(item).toHaveProperty('id', 'a');
  });

  /*
  it('should add id to stored objects', () => {
    const cache = new Cache('./temp', { next: () => 'added-id' });
    const item = cache.getOrStore({ foo: 'bar' });
    expect(item).toHaveProperty('id', 'added-id');
  });

  it('should return the same object for the same input', () => {
    const cache = new Cache('./temp', { next: () => 'added-id' });
    const item1 = cache.getOrStore({ foo: 'bar' });
    const item2 = cache.getOrStore({ foo: 'bar' });
    expect(item1).toBe(item2);
  });

  it('should return different objects for different inputs', () => {
    const cache = new Cache('./temp', { next: () => 'added-id' });
    const item1 = cache.getOrStore({ foo: 'bar' });
    const item2 = cache.getOrStore({ foo: 'baz' });
    expect(item1).not.toBe(item2);
  });

  it('should return all items', () => {
    const cache = new Cache('./temp', { next: () => 'added-id' });
    cache.getOrStore({ foo: 'bar' });
    cache.getOrStore({ foo: 'baz' });
    expect(cache.items()).toHaveLength(2);
  });

  it('should return only items with the given ids', () => {
    let idCounter = 0;
    const cache = new Cache('./temp', { next: () => idCounter++ });
    const item1 = cache.getOrStore({ foo: 'bar' });
    const item2 = cache.getOrStore({ foo: 'baz' });

    const firstResult = cache.items([item1.id]);
    expect(firstResult).toHaveLength(1);
    expect(firstResult).toContain(item1);

    const secondResult = cache.items([item2.id]);
    expect(secondResult).toHaveLength(1);
    expect(secondResult).toContain(item2);
  });

   */
});
