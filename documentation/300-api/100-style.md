---
title: style
description: Public API
---

# style

Create a new style object and return a classList.

```ts compile
// style.ts
import { style } from '@navita/css';

const classList = style({
  color: 'red',
  fontSize: 12,
  fontWeight: 'bold',
});

console.log(classList);
// => 'a b c', where a, b and c are generated class names
```

This classList is then used to style elements.
CSS Variables, pseudos, selectors, and media/feature queries are all supported.

## Example

Here's an example Button component in React:

```tsx compile filename=button.tsx
// button.tsx
import { style } from '@navita/css';

const button = style({
  background: 'hotpink',
  padding: '8px',
  color: 'white',
  fontWeight: 'bold',
  ':hover': {
    background: 'royalblue',
  },
  '@media (max-width: 600px)': {
    background: 'orange',
  },
});

type Props = JSX.IntrinsicElements['button'] & { 
  children: React.ReactNode;
};

export const Button = ({ children, ...rest }: Props) => (
  <button {...rest} className={button}>{children}</button>
);
```
