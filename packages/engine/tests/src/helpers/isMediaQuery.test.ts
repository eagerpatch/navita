import { isMediaQuery } from "../../../src/helpers/isMediaQuery";

describe('isMediaQuery', () => {
  it('should return true if the property starts with @media', () => {
    expect(isMediaQuery('@media screen and (min-width: 500px)')).toBe(true);
  });

  it('should return false if the property does not start with @media', () => {
    expect(isMediaQuery('color')).toBe(false);
  });
});
