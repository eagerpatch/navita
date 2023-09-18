import { isNestedSelector } from "../../../src/helpers/isNestedSelector";

describe('isNestedSelector', () => {
  it('should return true if the property starts with :', () => {
    expect(isNestedSelector(':hover')).toBe(true);
  });

  it('should return true if the property starts with [', () => {
    expect(isNestedSelector('[disabled]')).toBe(true);
  });

  it('should return true if the property starts with >', () => {
    expect(isNestedSelector('> div')).toBe(true);
  });

  it('should return true if the property starts with &', () => {
    expect(isNestedSelector('&:hover')).toBe(true);
  });

  it('should return false if the property does not start with : or [ or > or &', () => {
    expect(isNestedSelector('div')).toBe(false);
  });
});
