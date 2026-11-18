---
title: Webpack
description: 
---

# Webpack

A plugin for integrating Navita with [webpack](https://webpack.js.org).

## Installation

```bash
npm install --save-dev @navita/webpack-plugin mini-css-extract-plugin
```

## Setup

Navita requires [MiniCssExtractPlugin](https://webpack.js.org/plugins/mini-css-extract-plugin/) to be installed.
If you want to rename the output CSS file, you can use the `filename` option of MiniCssExtractPlugin.
Navita uses it for its runtime for dynamic chunks.

Navita also combines its result with MiniCssExtractPlugin's result. 

Add the plugin and MiniCssExtractPlugin to your Webpack configuration,
along with any desired [plugin configuration](#configuration).

```js
// webpack.config.js
const { NavitaPlugin } = require('@navita/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new MiniCssExtractPlugin(),
    new NavitaPlugin({
      // Desired configuration
    })
  ]
};
```

You don't need to do anything else to get started! 🎉

The plugin will automatically generate a CSS file and include it in your bundle.
There's no need for other rules or loaders.

> You don't need to set up a CSS loader for Navita to work. Since we know all CSS at build time, we skip adding more
> modules to the Webpack compilation, and emit CSS assets at the right time in the build instead.

## Configuration

The plugin accepts an option object with the following properties:

#### `exclude`

*Default*: `/node_modules/`

Exclude certain files from being processed by Navita.
It works like Webpack's [rule.exclude](https://webpack.js.org/configuration/module/#ruleexclude).

#### `outputCss?: boolean`

*Default*: `true`

This option is used to control whether the plugin should output a CSS file.
Most often used in combination with multiple instances of the plugin—where one instance might just be used
to collect CSS, and another to output CSS.

#### `optimizeCSSOutput?: (output: CSSOutput) => Map`

> Refer to the source for better types of `optimizeCSSOutput`.

This is an advanced option that allows you to control the output of the CSS.
The type CSSOutput is a map of all Chunks that will render css, together with the filePaths that belongs in that chunk.

Take a look at the source code for the [Next-plugins implementation
of `optimizeCSSOutput`](https://github.com/eagerpatch/navita/blob/main/packages/next-plugin/src/optimizeCSSOutput.ts) to get a better understanding
of how it works.  

The idea is to allow you to control the output of the CSS, so that you can optimize it for your use case.

#### `importMap?: { callee: string; source: string; }[]`

*Default*: `import { importMap } from "@navita/css"`

ImportMap is a feature that allows you to extend the functionality of Navita.

If you provide your own, it will be merged with the default importMap.

## Opinionated Layers

To be able to produce multiple CSS files,
and to work around the problem of CSS specificity,
Navita uses [Cascade layers](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers) in a
specific manner
to ensure and enforce that another chunk's CSS does not override a previous one.

<blockquote>

If you don't want these layers, make sure that Navita only produces a single CSS file.
You can do this by adding a cacheGroup:

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        navita: {
          chunks: "all",
          enforce: true,
          name: "navita",
          type: "css/navita" // You can also group in css/mini-css-extract if you want a single output
        }
      }
    }
  }
};
```

</blockquote>

We try to break the CSS rule of "last rule wins" by using the cascade layers to our advantage.

We create three implicit outer layers in the following order:
1. `static` - contains all CSS created from the `global*`-APIs.
2. `rules` - contains all atomic classes.
3. `at` - contains all at-rules.
