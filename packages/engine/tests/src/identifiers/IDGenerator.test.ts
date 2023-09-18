import { IDGenerator } from "../../../src/identifiers/IDGenerator";

describe('IDGenerator', () => {
  it('should increment by one on every next call', () => {
    const generator = new IDGenerator();

    expect(generator.next()).toBe(1);
    expect(generator.next()).toBe(2);
    expect(generator.next()).toBe(3);
    expect(generator.next()).toBe(4);
  });
});
