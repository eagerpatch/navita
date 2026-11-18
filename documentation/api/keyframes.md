---
title: keyframes
description: Public API
---

# keyframes

Creates a locally scoped [animation name](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-name) for the defined [@keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes).

```ts compile
// keyframes.ts
import { keyframes, style } from '@navita/css';

const rotate = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' }
});

const spin = style({
  animationName: rotate,
  animationDuration: '3s'
});

// or interpolate as a shorthand:
const spinAgain = style({
  animation: `${rotate} 3s`
});
```
