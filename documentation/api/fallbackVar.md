---
title: fallbackVar
description: Public API
---

# fallbackVar

Provides fallback values for variables that have been created using Navita APIs,
e.g. `createVar`, `createTheme`, etc.

As these APIs produce variable references that contain the CSS var function,
e.g. `var(--_a)`, it is necessary to handle the wrapping function when providing a fallback.

Realistically,
you probably wouldn't use this API unless you integrate with third-party libraries that use CSS variables.

```ts compile
// fallback-var.ts
import { createVar, fallbackVar, style } from '@navita/css';

const colorVar = createVar();

const color = style({
  color: fallbackVar(colorVar, 'royalblue')
});
```

## Multiple fallbacks values

The `fallbackVar` function handles falling back across multiple variables by providing multiple parameters.

```ts compile
// multiple-fallback-var.ts
import { createVar, fallbackVar, style } from '@navita/css';

const primaryVar = createVar();
const secondaryVar = createVar();

const color = style({
  color: fallbackVar(primaryVar, secondaryVar, 'royalblue')
});
```
