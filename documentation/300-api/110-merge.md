---
title: merge
description: Public API
---

# merge

> Merge is the only runtime API in Navita.

Merges multiple style objects into a single style object.

```ts compile
// merge.ts
import { merge, style } from '@navita/css';

const pink = style({
  color: 'hotpink',
});
// => 'a'

const blue = style({
  background: 'royalblue',
  color: 'royalblue'
});
// => 'b c'

const merged = merge(blue, pink);
// => 'a b'
```

As you can see, the color with royalblue is overwritten by the color with hotpink.
You will not get any conflicts in the element, since the last style wins.

## How?

All atomic classes created by Navita use a naming pattern like `${property}${value}`.
If we find two classes that share the same property, we can assume that they are conflicting,
and use the last provided class.

## Caveats

- Merge is a runtime API — but it's very small.
- Merging classes that are not created with Navita will only work if they follow the naming pattern.
- Merging classes that are not atomic will create unintended side effects. Use [clxs](https://github.com/lukeed/clsx) for that.
