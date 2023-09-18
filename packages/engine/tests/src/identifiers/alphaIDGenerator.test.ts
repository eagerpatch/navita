import { AlphaIDGenerator } from "../../../src/identifiers/alphaIDGenerator";

describe('AlphaIDGenerator', () => {
  it('should increment by one alpha numerically on each next-call', () => {
    const generator = new AlphaIDGenerator();

    expect(generator.next()).toBe('a');
    expect(generator.next()).toBe('b');
    expect(generator.next()).toBe('c');
    expect(generator.next()).toBe('d');
  });

  it('should respect the blacklist', () => {
    const generator = new AlphaIDGenerator(['a', 'b', 'c']);

    expect(generator.next()).toBe('d');
    expect(generator.next()).toBe('e');
    expect(generator.next()).toBe('f');
    expect(generator.next()).toBe('g');
  });

  it('should start over when the alphabet is exhausted', () => {
    const generator = new AlphaIDGenerator([]); // no blacklist

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < chars.length; i++) {
      generator.next();
    }

    expect(generator.next()).toBe('aa');
    expect(generator.next()).toBe('ab');
    expect(generator.next()).toBe('ac');
    expect(generator.next()).toBe('ad');
  });
});
