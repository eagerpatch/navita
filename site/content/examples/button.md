```ts compiled filename=Button.ts
import { style } from '@navita/css';

const button = style({
  background: 'hotpink',
  color: 'white',
});

document.write(`
  <button class="${button}">
    Click me!
  </button>
`);
```
