import { getPropertyPriority } from "../../../src/helpers/getPropertyPriority";

describe('getPropertyPriority', () => {
  it('returns 1 for non-shorthand properties', () => {
    expect(getPropertyPriority('color')).toBe(1);
    expect(getPropertyPriority('background')).toBe(1);
  });

  it('returns 2 for long-hand properties', () => {
    expect(getPropertyPriority('background-color')).toBe(2);
    expect(getPropertyPriority('background-image')).toBe(2);
  });
});
