---
title: Styling
description: An overview of the styling concepts
---

# Styling

All the styling APIs in Navita take a style object as input.
Describing styles as a JavaScript object enables much better use of TypeScript
through your styling code, as the styles are typed data-structures like the rest of your application code.
It also brings type-safety and autocomplete to CSS authoring (via [csstype](https://github.com/frenic/csstype)).

There are two main differences between Navita and other zero-runtime CSS-in-JS libraries:

1. Navita by default generates [Atomic CSS](#atomic-css) classes, which are small, single-purpose classes that can be
   combined to create complex styles.
2. Navita doesn't require a special extension to work.

## Atomic CSS

The concept behind Atomic CSS is to break down styling properties into their smallest components and then combine them
as needed to create a cohesive design.
This approach contrasts with traditional CSS methodologies, where styles are
often written on a per-component basis and can lead to duplication and inefficiencies.

## File extension

Navita doesn't require a special extension to work.
After you've installed Navita, you can use it to style any of your JavaScript or TypeScript files.

## CSS Properties

At the top-level of the style object, CSS properties can be set just like when writing a regular CSS class.
The only difference is all properties use camelCase rather than kebab-case.

```ts compile
// example.ts
import { style, globalStyle } from '@navita/css';

const container = style({
  color: 'red',
  fontSize: '12px',
});

globalStyle('body', {
  margin: 0,
});
```

## Unitless Properties

Some properties accept numbers as values.
Excluding [unitless properties](https://github.com/eagerpatch/navita/blob/183eafe53b27645be6232c10fdaeb58ddbe504fc/packages/engine/src/helpers/pixelifyProperties.ts#L1),
these values are assumed to be a pixel and px is automatically appended to the value.

```tsx compile
// example.ts
import { style } from '@navita/css';

const myStyle = style({
  // cast to pixels
  padding: 10,
  marginTop: 25,

  // unitless properties
  flexGrow: 1,
  opacity: 0.5
});
```
