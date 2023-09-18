---
title: globalStyle
description: Public API
---

# globalStyle

Creates styles attached to a global selector.

Requires a selector string as the first parameter, followed by a style object.

```ts compile
// reset.ts
import { globalStyle } from "@navita/css";

globalStyle('html, body', {
  margin: 0,
  padding: 0,
});

globalStyle("body", {
  background: "hotpink",
});
```

## Side Effects

Due to tree shaking, it's important to explicitly import any global styles you create:

```ts
// app.ts
import './reset.ts';

// Rest of your app code
```

If you use `globalStyle`s in your application entry point, you don't need to worry about this.

Here's an example where your globalStyles will be tree shaken away and not visible in the final CSS output:

```ts compile
// theme.ts
import { globalStyle } from "@navita/css";

export const TOKEN_COLOR_BRAND = 'hotpink';

globalStyle('body', {
  background: TOKEN_COLOR_BRAND,
});
```

```tsx
// app.tsx
import { TOKEN_COLOR_BRAND } from './theme2.ts';

const App = () => (
  <h1>Our Brand Color: ${TOKEN_COLOR_BRAND}</h1>
);
```

The easiest way to fix this is to explicitly import your file with `globalStyle`s:

```ts
// app.ts
import './theme.ts';
import { TOKEN_COLOR_BRAND } from './theme.ts';

// The rest of your app code
```
