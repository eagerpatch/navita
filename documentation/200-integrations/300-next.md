---
title: Next.js
description:
---

# Next.js

A plugin for integrating Navita with [Next.js](https://nextjs.org).

> Navita has first-class support for Next.js! It works in both React Server Components and Client Components! 🎉

## Installation

```bash
npm install --save-dev @navita/next-plugin
```

> Support for App-router has been tested from Next.js version `13.4.13`

> Support for Pages-router has been tested from Next.js version `12.3.4`


## Setup

If you don't have a `next.config.js` file in the root of your project, create one.
Add the plugin to your `next.config.js` file, along with any desired [plugin configuration](#configuration).

```js
const { createNavitaStylePlugin } = require('@navita/next-plugin');
const withNavita = createNavitaStylePlugin({
  // Desired configuration
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withNavita(nextConfig);
```

You don't need to do anything else to get started!
🎉 It will just work, regardless if you are using the page router or the app router!

## Configuration

The plugin accepts everything from the [Webpack](100-webpack.md#configuration)-integration plus the following:

#### `singleCssFile?: boolean`

*Default*: `false`

If you don't like the opinionated layers that Navita adds when outputting multiple CSS files,
you can use this option to output a single CSS file instead.

Multiple CSS files will produce a faster first paint,
since they are generally smaller for the specific page, but it will transfer more content over the network. 

The [Webpack documentation for Navita](100-webpack.md#opinionated-layers) explains a bit more about the opinionated layers.
