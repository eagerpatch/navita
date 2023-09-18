---
title: Motivation
description: Why was Navita created?
---

# Motivation

[Christopher Chedeau](https://blog.vjeux.com/) gave
a [talk about css-in-js](https://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html) at the end of 2014. Since
then, multiple different solutions that take his core ideas have been created.

Two of the more popular solutions are [styled-components](https://styled-components.com/)
and [emotion](https://emotion.sh/).
Both are great, but they have some drawbacks—the most significant being that all styling computations and applications
occur at runtime.

This means that the JavaScript bundle and the CSS are intertwined, resulting in a bundle that
combines both code and styles. While this approach offers benefits like encapsulation and dynamic styling, it can also
impact the initial page load performance, as the browser needs to process and apply styles before rendering the content.

Since these libraries became popular, the JavaScript ecosystem has evolved,
and there are now many tools that can provide build-time css-in-js.
No runtime means no extra bundle size, no extra processing for your users.

## Why Navita?

We tried to solve what others didn't.
[Vanilla-Extract](https://vanilla-extract.style/) is a fantastic library, and we've taken massive inspiration from it.
Some parts of the public API are more or less copies of it.
We also have used some parts of their documentation to explain concepts.

But Navita is written from the ground up.

There are two main differences between Navita and Vanilla-Extract:

1. Navita generates [Atomic CSS](300-styling.md#atomic-css) classes by default.
2. Navita doesn't require a special extension to work. You can co-locate your styles with your components.

Navita is also fully compatible with React Server Components, and we
have [first-class support](../200-integrations/300-next.md) for [Next.js](https://nextjs.org/)!

We've also tried to make Navita as fast as possible.
Smart caching, and no internal bundler has allowed us to have minimal development performance impact.

## The Future

We have a lot of ideas for the future of Navita.
If you feel like there's something missing—please let us know, and we'll try to make it happen!

We're also looking for contributors, so if you want to help us make Navita better, please reach out!

Some ideas on the roadmap:
- `styled`-API
- Expanding shorthand properties
- The ability to configure the engine to not assume pixels for numeric values.

## Alternatives

As always in the JavaScript ecosystem, there are many alternatives to Navita.
Some of them have been used as motivation, and some of them are just great libraries!

- [Linaria](https://linaria.dev/)
- [Vanilla-Extract](https://vanilla-extract.style/)
- [Astroturf](https://github.com/astroturfcss/astroturf)
- [Compiled](https://compiledcssinjs.com/)
- [Style9](https://style9.io/)
- [Griffel](https://github.com/microsoft/griffel)
- [Stitches](https://stitches.dev/)
