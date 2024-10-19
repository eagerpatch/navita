---
title: Remix
description:
---

# Remix

A plugin for integrating Navita with [Remix](https://remix.run/).

> Navita has first-class support for Remix! It works both in the server and on the client! 🎉

## Installation

```bash
npm install --save-dev @navita/vite-plugin
```

## Setup

Add the plugin to your Vite configuration, along with any desired [plugin configuration](#configuration).

```js
// vite.config.js
import { navitaRemix } from '@navita/vite-plugin/remix';

export default {
  plugins: [
    navitaRemix({
      // configuration
    }),
    // ...other plugins
  ]
};
```

Please note that the import is different from the Vite plugin. The Remix plugin is based on, and uses the Vite plugin,
but we've added some extra functionality to make it better suited for Remix.

One example of this is that you would be able to use Navita styles in your server as well.
You'll also get a better developer experience, since we automatically inject the virtual Navita styles into your root-component, and avoid double declarations, other solutions have.

## Configuration

> The Remix plugin is based on the Vite plugin, so you can use the same configuration options.

The plugin accepts the following as optional configuration:

#### `importMap?: { callee: string, source: string }[]`
*Default*: `import { importMap } from "@navita/css"`

ImportMap is a feature that allows you to extend the functionality of Navita.

If you provide your own, it will be merged with the default importMap.
