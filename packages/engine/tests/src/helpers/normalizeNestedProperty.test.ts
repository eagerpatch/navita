import { normalizeNestedProperty } from "../../../src/helpers/normalizeNestedProperty";

describe('NormalizeNestedProperty', () => {
  it('should remove starting ampersand', () => {
    expect(normalizeNestedProperty('&.foo')).toEqual('.foo');
  });

  it('should return the same string if no ampersand is found', () => {
    expect(normalizeNestedProperty('.foo')).toEqual('.foo');
    expect(normalizeNestedProperty('> :first-child')).toEqual('> :first-child');
    expect(normalizeNestedProperty('> something')).toEqual('> something');
  });
});
