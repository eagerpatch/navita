---
"@navita/vite-plugin": minor
"@navita/core": minor
---

Support consuming component libraries authored WITH navita as dependencies via a
new `transformNodeModules` option.

By default the vite plugin skips every file under `node_modules`, so a library
shipping un-compiled `style()`/theme calls throws "Could not find an adapter" at
runtime. Pass matchers (a substring or `RegExp` tested against the module id) for
the `node_modules` paths that should be treated as navita source:

```ts
navita({ transformNodeModules: ["@acme/ui", /@acme\/.*\/navita\//] })
```

A matched path is both **transformed** and **recursively evaluated** — the latter
is what makes a library's own cross-file imports (a theme/tokens file it ships)
resolve correctly instead of being imported as an opaque module, and makes those
files tracked as watchable dependencies for HMR. `@navita/core`'s renderer gained
the matching `transformNodeModules` option that drives this evaluation gate.
navita's own packages (`@navita/*`) stay external regardless of the matchers.

Works across `navita`, `navitaRwsdk`, and `navitaRemix` (the option flows through
to the shared renderer).
