---
title: createTheme
description: Public API
---

# createTheme

Creates a locally scoped theme class and a theme contract which can be consumed within your styles.

> 🎨 New to theming in Navita? Make sure you've read the [theming overview](../100-overview/400-theming.md) first.

```ts compile
// theme.ts
import { createTheme, style } from "@navita/css";

const [themeClass, vars] = createTheme({
  color: {
    brand: 'hotpink',
    accent: 'royalblue'
  },
});

const brandText = style({
  color: vars.color.brand,
});
```

## Creating theme variants

Theme variants can be created by passing a theme contract as the first argument to createTheme.

All theme values must be provided, or it is a type error.

```ts compile
// theme.ts
import { createTheme, style } from "@navita/css";

const [themePink, vars] = createTheme({
  colors: {
    brand: 'hotpink'
  }
});

const themeBlue = createTheme(vars, {
  colors: {
    brand: 'royalblue'
  }
});

const brandText = style({
  color: vars.colors.brand,
});
```

