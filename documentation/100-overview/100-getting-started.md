---
title: Getting Started
description: How to get started with Navita
---

# Getting Started

It's extremely easy to get started with Navita. This guide will show you how!

## Installation

```bash
npm install @navita/css --save
```

## Bundler Integration

Like other Zero-runtime CSS-in-JS libraries, Navita requires a bundler to work.
We might publish a runtime adapter in the future — but there are better projects for that.
Upvote [this issue](https://github.com/eagerpatch/navita/issues/1) if you need it.

Currently, we provide integrations for the following bundlers:

- [vite]
- [webpack]
- [next]

After installing the integration to your project, you can start to use Navita!

## Example

```ts compile filename=example.ts
import { style } from '@navita/css';

const button = style({
  background: 'hotpink',
  color: 'white',
});
```

This creates a class for each css rule and registers them into the stylesheet engine.
The bundler will then emit the styles during the build.  

> Navita doesn't require special file extensions to work — You can co-locate your styles with your components!

[webpack]: /documentation/200-integrations/100-webpack.md
[vite]: /documentation/200-integrations/200-vite.md
[next]: /documentation/200-integrations/300-next.md
