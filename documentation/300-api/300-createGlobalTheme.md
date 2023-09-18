---
title: createGlobalTheme
description: Public API
---

# createGlobalTheme

Creates a theme attached to a global selector, but with locally scoped variable names.

> 🎨 New to theming in Navita? Make sure you've read the [theming overview](../100-overview/400-theming.md) first.

```ts compile
// theme.ts
import { createGlobalTheme } from '@navita/css';

export const vars = createGlobalTheme(':root', {
  color: {
    brand: 'blue'
  },
  font: {
    body: 'arial'
  }
});
```

All theme values must be provided, or it is a type error.

Import this stylesheet as a side effect to include the styles in your CSS bundle.

```ts
// app.ts
import './theme.ts';
```

## Implementing a Theme Contract

An existing theme contract can be implemented by passing it as the second argument.

```ts
// theme.ts
import { createThemeContract, createGlobalTheme } from '@navita/css';

export const vars = createThemeContract({
  color: {
    brand: null
  },
  font: {
    body: null
  }
});

createGlobalTheme(':root', vars, {
  color: {
    brand: 'blue'
  },
  font: {
    body: 'arial'
  }
});
```
