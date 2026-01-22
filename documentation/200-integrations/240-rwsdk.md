---
title: rwsdk
description:
---

# rwsdk

A plugin for integrating Navita with [rwsdk](https://rwsdk.com/) (RedwoodJS SDK).

> Navita has first-class support for rwsdk! It works with Cloudflare Workers SSR! 🎉

## Installation

```bash
npm install --save-dev @navita/vite-plugin
```

## Setup

Add the plugin to your Vite configuration, along with any desired [plugin configuration](#configuration).

```js
// vite.config.mts
import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { navitaRwsdk } from "@navita/vite-plugin/rwsdk";

export default defineConfig({
  plugins: [
    navitaRwsdk({
      // configuration
    }),
    cloudflare({ viteEnvironment: { name: "worker" } }),
    redwood(),
  ],
});
```

Please note that the import is different from the Vite plugin. The rwsdk plugin is based on, and uses the Vite plugin,
but we've added some extra functionality to make it better suited for rwsdk's build architecture.

### Using Navita styles

In your `Document.tsx`, add a link to the virtual Navita stylesheet:

```tsx
// src/Document.tsx
export const Document: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <link rel="stylesheet" href="/virtual:navita.css" />
    </head>
    <body>
      <div id="root">{children}</div>
      <script>import("/src/client.tsx")</script>
    </body>
  </html>
);
```

The plugin will automatically replace the virtual path with the hashed CSS file path during the build process.

## How it works

rwsdk has a unique build architecture with three passes:

1. **Client build**: Standard Vite client build that outputs assets to `dist/client/`
2. **Worker build**: Server-side worker bundle that renders React components
3. **Linker pass**: A special build pass that processes the worker bundle and replaces asset placeholders with hashed paths from the client manifest

The base Navita plugin works correctly for the client build - CSS is emitted and registered in the Vite manifest.
The rwsdk plugin adds a `renderChunk` hook that runs during the linker pass to replace `/virtual:navita.css` references
with the actual hashed filename from the client manifest.

## Configuration

> The rwsdk plugin is based on the Vite plugin, so you can use the same configuration options.

The plugin accepts the following as optional configuration:

#### `importMap?: { callee: string, source: string }[]`
*Default*: `import { importMap } from "@navita/css"`

ImportMap is a feature that allows you to extend the functionality of Navita.

If you provide your own, it will be merged with the default importMap.
