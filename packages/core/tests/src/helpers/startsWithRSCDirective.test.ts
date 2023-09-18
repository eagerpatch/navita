import { startsWithRSCDirective } from "../../../src/helpers/startsWithRSCDirective";

describe('startsWithRSCDirective', () => {
  it('should return true if content starts with "use client"', () => {
    expect(startsWithRSCDirective(`'use client';`)).toBe(true);
    expect(startsWithRSCDirective(`"use client";`)).toBe(true);
    expect(startsWithRSCDirective(`"use client"`)).toBe(true);
    expect(startsWithRSCDirective(`'use client'`)).toBe(true);
  });

  it('should not count mismatched quotes', () => {
    expect(startsWithRSCDirective(`"use client';`)).toBe(false);
    expect(startsWithRSCDirective(`'use client";`)).toBe(false);
  });

  it('should return false if content does not start with "use client"', () => {
    expect(startsWithRSCDirective(`import * as react from 'react'`)).toBe(false);
  });
});
