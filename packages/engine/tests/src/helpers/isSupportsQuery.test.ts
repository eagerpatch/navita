import { isSupportsQuery } from "../../../src/helpers/isSupportsQuery";

describe('isMediaQuery', () => {
  it('should return true if the property starts with @supports', () => {
    expect(isSupportsQuery('@supports (display: flex)')).toBe(true);
  });

  it('should return false if the property does not start with @supports', () => {
    expect(isSupportsQuery('background')).toBe(false);
  });
});
