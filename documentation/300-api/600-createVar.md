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
