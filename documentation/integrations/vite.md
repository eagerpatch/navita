---
title: Vite
description:
---

# Vite

A plugin for integrating Navita with [Vite](https://vitejs.dev/).

## Installation

```bash
npm install --save-dev @navita/vite-plugin
```

## Setup

Add the plugin to your Vite configuration, along with any desired [plugin configuration](#configuration).

```js
// vite.config.js
import { navita } from '@navita/vite-plugin';

export default {
  plugins: [navita({
    // configuration
  })]
};
```

## Configuration

> Please help us expand the Vite-plugin and the configuration options by [contributing](https://github.com/eagerpatch/navita) to the project.

The plugin accepts the following as optional configuration:

#### `importMap?: { callee: string, source: string }[]`
*Default*: `import { importMap } from "@navita/css"`

ImportMap is a feature that allows you to extend the functionality of Navita.

If you provide your own, it will be merged with the default importMap.
