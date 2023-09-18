---
title: Theming
description: Learn the concepts behind themes in Navita
---

# Theming

Navita uses a powerful theming system that allows you to customize the presentation of your application to match your
brand or style. You can customize the appearance of your entire application, or even create multiple themes for
different sections of your product.

Theming in Navita is just a set of helpers on top of the scoped CSS variable creation provided
by [createVar](../300-api/600-createVar.md).

To understand how it works, let's start with a simple example:

```ts compile
// theme.ts
import { createTheme } from '@navita/css';

const [themeClass, vars] = createTheme({
  color: {
    brand: 'hotpink'
  },
  font: {
    family: 'verdana'
  }
});

const otherThemeClass = createTheme(vars, {
  color: {
    brand: 'royalblue'
  },
  font: {
    family: 'Comic Sans MS'
  }
});
```

By passing in an existing theme contract, instead of creating new CSS variables, the existing ones are reused, but
assigned to new values within a new CSS class.

On top of this, Navita knows the type of the existing theme contract and requires you to implement it completely and
correctly.

The result of the above code will be equivalent to this:

```ts
// Example result of the above code
import './generated.css';

const vars = {
  color: {
    brand: 'var(--color-brand)'
  },
  font: {
    family: 'var(--font-family)'
  }
};

const themeClass = 'theme-1';
const otherThemeClass = 'theme-2';
```

(The generated code will look different — in fact, use the "compile" tab to see the actual result)

## Theme contracts

You can create a theme contract by using the `createThemeContract` function:

```ts compile
// contract.ts
import { createThemeContract } from '@navita/css';

const vars = createThemeContract({
  color: {
    brand: 'hotpink'
  },
  font: {
    family: 'verdana'
  }
});
```

There's no real difference between the themeContract created by `createTheme` and `createThemeContract`.
It could provide a better code structure for your application, but it's not required to use.

Using variables from other Navita exports will never cause any side effects or imports of unintentional CSS.
