---
title: createGlobalThemeContract
description: Public API
---

# createGlobalThemeContract

Creates a contract of globally scoped variable names for themes to implement.

This is useful if you want to make your theme contract available to non-JavaScript environments.

> 🎨 New to theming in Navita? Make sure you've read the [theming overview](../100-overview/400-theming.md) first.

```ts compile
// theme.ts
import { 
  createGlobalThemeContract,
  createGlobalTheme,
  style
} from '@navita/css';

const vars = createGlobalThemeContract({
  color: {
    brand: 'color-brand'
  },
});

createGlobalTheme(':root', vars, {
  color: {
    brand: 'blue'
  },
});

const brandText = style({
  color: vars.color.brand,
});
```

## Formatting the variable names


A map function can be provided as the second argument which has access to the value and the object path.

For example, you can automatically prefix all variable names:

```ts compile
// theme.ts
import { 
  createGlobalThemeContract,
  createGlobalTheme
} from '@navita/css';

export const vars = createGlobalThemeContract({
    color: {
      brand: 'color-brand'
    },
  }, (value) => `prefix-${value}`);

createGlobalTheme(':root', vars, {
  color: {
    brand: 'blue'
  },
});
```

Or, automatically generate names from the object path.

For example, converting to TitleCase:

```ts compile
// theme.ts
import {
  createGlobalThemeContract,
  createGlobalTheme
} from '@navita/css';

const toTitleCase = (s) =>
  `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

export const vars = createGlobalThemeContract(
  {
    color: {
      brand: null
    },
  },
  (_value, path) => `${path.map(toTitleCase).join('')}`
);

createGlobalTheme(':root', vars, {
  color: {
    brand: 'blue'
  },
});
```
