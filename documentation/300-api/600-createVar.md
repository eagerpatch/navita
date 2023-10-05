---
title: createVar
description: Public API
---

# createVar

Creates a single scoped CSS Variable reference.

```tsx compile
// create-variable.ts
import { createVar } from '@navita/css';

const accentVar = createVar();
```

As you can see, no CSS is generated when you create a variable; it is only a reference that can be set later on.

## Setting the variable

You can now set the variable in the style-object.
This is essentially what happens in the [createTheme](./200-createTheme.md) API.

```tsx compile
// set-variable.ts
import { style, createVar } from '@navita/css';

const accentVar = createVar();

const accent = style({
  [accentVar]: 'hotpink',
});
```

## Using the variable

The variable reference can then be passed as the value for any CSS property.

```tsx compile
// use-variable.ts
import { style, createVar } from '@navita/css';

const accentVar = createVar();

const accentText = style({
  color: accentVar,
});
```

## Consuming CSS Variables

Navita recognizes whenever you try to use CSS variables as a property or a value and adjusts correctly. 
What this means is that you can pass in a CSS variable as a value to a property, and it will be correctly resolved.

```tsx compile filename="variable-as-value.ts"
import { style } from '@navita/css';

const container = style({
  // "--accent" might come from a library or somewhere else
  color: '--accent',
  background: 'var(--accent)',
});
```

In the above example, Navita doesn't care that `--accent` is not a valid CSS property.
If it finds something that looks like a CSS variables in the property, it'll wrap it in `var()` for you.

The same goes for when you are using a CSS variable as a property, but the inverse:

```tsx compile filename="variable-as-property.ts"
import { style } from '@navita/css';

const container = style({
  'var(--accent)': 'hotpink',
});
```
