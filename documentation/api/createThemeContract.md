---
title: createThemeContract
description: Public API
---

# createThemeContract

Creates a contract of locally scoped variable names for themes to implement.

Useful if you want to separate the implementation of a theme from the creation of the theme contract.

> 🎨 New to theming in Navita? Make sure you've read the [theming overview](../overview/theming.md) first.

```ts compile
// theme.ts
import { createThemeContract, createTheme, style } from '@navita/css';

const vars = createThemeContract({
  color: {
    brand: null
  },
  // More properties to fit your needs.
});

const blueTheme = createTheme(vars, {
  color: {
    brand: 'royalblue'
  },
});

const pinkTheme = createTheme(vars, {
  color: {
    brand: 'hotpink'
  },
});

const brandText = style({
  color: vars.color.brand,
});
```
