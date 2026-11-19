---
"@navita/adapter": patch
"@navita/css": patch
"@navita/engine": patch
"@navita/jest": patch
"@navita/next-plugin": patch
"@navita/types": patch
"@navita/vite-plugin": patch
"@navita/vitest": patch
---

The ESM build no longer starts every module of these packages with `import "node:path"; import "node:url"; import.meta.url;`. That was the `__dirname` shim tsdown adds with `shims: true`, stamped onto each file of a file-per-module build whether it used `__dirname` or not. The shim is now on only for a package whose sources use `__dirname` or `__filename` (core, extraction, webpack-plugin). A client build that bundles `@navita/css` (`style`, `globalStyle`, … left in a browser module) no longer has to externalize `node:path` and `node:url` once per module — Vite warned about each.
