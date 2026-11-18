---
title: fontFace
description: Public API
---

# fontFace

Creates a locally scoped [font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-family) for the defined [@font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face).

```ts compile
// fontFace.ts
import { fontFace, style } from '@navita/css';

const comicSans = fontFace({
  src: 'local("Comic Sans MS")'
});

const font = style({
  fontFamily: comicSans
});
```

## Multiple Fonts with Single Family

```ts compile
// fontFace.ts
import { fontFace, style } from '@navita/css';

const gentium = fontFace([
  {
    src: 'local("Gentium")',
    fontWeight: 'normal'
  },
  {
    src: 'local("Gentium Bold")',
    fontWeight: 'bold'
  }
]);

export const font = style({
  fontFamily: gentium
});
```
