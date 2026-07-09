# @navita/vite-plugin

## 3.0.0-next.2

### Minor Changes

- 7d7ba52: Support consuming component libraries authored WITH navita as dependencies via a
  new `transformNodeModules` option.

  By default the vite plugin skips every file under `node_modules`, so a library
  shipping un-compiled `style()`/theme calls throws "Could not find an adapter" at
  runtime. Pass matchers (a substring or `RegExp` tested against the module id) for
  the `node_modules` paths that should be treated as navita source:

  ```ts
  navita({ transformNodeModules: ["@acme/ui", /@acme\/.*\/navita\//] });
  ```

  A matched path is both **transformed** and **recursively evaluated** — the latter
  is what makes a library's own cross-file imports (a theme/tokens file it ships)
  resolve correctly instead of being imported as an opaque module, and makes those
  files tracked as watchable dependencies for HMR. `@navita/core`'s renderer gained
  the matching `transformNodeModules` option that drives this evaluation gate.
  navita's own packages (`@navita/*`) stay external regardless of the matchers.

  Works across `navita`, `navitaRwsdk`, and `navitaRemix` (the option flows through
  to the shared renderer).

### Patch Changes

- Updated dependencies [7d7ba52]
  - @navita/core@3.0.0-next.2
  - @navita/css@3.0.0-next.2

## 3.0.0-next.1

### Patch Changes

- Updated dependencies [6537ac8]
  - @navita/core@3.0.0-next.1
  - @navita/css@3.0.0-next.1

## 3.0.0-next.0

### Major Changes

- 3df5c31: Navita v3 — unified versioning. The whole suite now releases in lockstep at a single version (changesets `fixed` group). This v3 line ships the modernized toolchain (OXC extraction, Vitest, Biome, tsdown, TypeScript 6) and the package changes (`@navita/swc` → `@navita/extraction`, the new `@navita/vitest`, and `@navita/jest` restored as a jest integration).

### Patch Changes

- f9f4aa5: **`@navita/extraction`: rewritten in pure JavaScript on top of OXC**, replacing the Rust
  crate that compiled to a `@swc/core` wasm plugin. Extraction now uses
  `oxc-parser` + `magic-string` + `oxc-transform` — no Rust toolchain, no cargo/wasm
  build, and the `@swc/core` dependency (and its version lock) is gone. The public
  `extraction()` API is unchanged and behavior is validated against the original
  fixtures plus an end-to-end CSS-equality test. Extraction benchmarks ~5.6x faster.
  Notes: positions are now UTF-16 string offsets (identical to before for all BMP
  text); the OXC packages are ESM-only, so Node >=20.19 / >=22.12 is required
  (handled transparently for CommonJS consumers, including Jest).

  **`@navita/vite-plugin`:** skip the `transform` hook during RedwoodSDK's worker
  "linker" pass (`RWSDK_BUILD_PASS=linker`). That pass re-feeds the already-built
  worker bundle through the plugin pipeline; navita re-processing it tried to
  resolve/evaluate runtime-only specifiers (`node:*`, `cloudflare:*`, `virtual:*`)
  and crashed the build.

- Updated dependencies [30ead96]
- Updated dependencies [3df5c31]
  - @navita/core@3.0.0-next.0
  - @navita/css@3.0.0-next.0

## 2.1.0

### Minor Changes

- 6d2749f: Add rwsdk (RedwoodJS SDK) support via new `@navita/vite-plugin/rwsdk` export

## 2.0.5

### Patch Changes

- Updated dependencies [f65bf12]
  - @navita/css@0.2.1
  - @navita/core@1.0.1

## 2.0.4

### Patch Changes

- 98b03e5: Added react-router support to remix vite-plugin

## 2.0.3

### Patch Changes

- @navita/core@1.0.1

## 2.0.2

### Patch Changes

- cafa840: Use options to determine if chunk belongs in server or client build

## 2.0.1

### Patch Changes

- 1859baa: change from middleware to transform for compatability with Shopify Hydrogen

## 2.0.0

### Major Changes

- 2d1ad33: Adding Remix-specific vite plugin.

  Instead of allowing Vite to extract the CSS, we use a virtual file, and send HMR updates to that file instead.

  During the build, we extract the CSS and write it to a file.

## 1.0.1

### Patch Changes

- e8a1084: Force the vite-plugin to use one renderer

## 1.0.0

### Major Changes

- c03767b: fix proper remix support in the vite plugin

### Patch Changes

- Updated dependencies [6d3783e]
- Updated dependencies [c03767b]
  - @navita/css@0.2.0
  - @navita/core@1.0.0

## 0.1.5

### Patch Changes

- @navita/core@0.2.1

## 0.1.4

### Patch Changes

- Updated dependencies [b0976b2]
  - @navita/core@0.2.0

## 0.1.3

### Patch Changes

- @navita/core@0.1.3

## 0.1.2

### Patch Changes

- @navita/core@0.1.2

## 0.1.1

### Patch Changes

- @navita/core@0.1.1

## 0.1.0

### Minor Changes

- a09e673: better cache handling when navita is used

### Patch Changes

- Updated dependencies [a09e673]
  - @navita/core@0.1.0
  - @navita/css@0.1.0

## 0.0.13

### Patch Changes

- Updated dependencies [d52050b]
  - @navita/css@0.0.13
  - @navita/core@0.0.13

## 0.0.12

### Patch Changes

- 4dbddc0: fix build script so tree shaking actually works when consuming packages
- Updated dependencies [4dbddc0]
  - @navita/css@0.0.12
  - @navita/core@0.0.12

## 0.0.11

### Patch Changes

- 974766e: Prevent library from being bundled to facilitate better tree shaking
- Updated dependencies [974766e]
  - @navita/core@0.0.11
  - @navita/css@0.0.11

## 0.0.10

### Patch Changes

- b02165f: normalize creation of css vars
- Updated dependencies [b02165f]
  - @navita/core@0.0.10
  - @navita/css@0.0.10

## 0.0.9

### Patch Changes

- a52048a: Replacing SWC-pass with MagicString
- Updated dependencies [a52048a]
  - @navita/core@0.0.9
  - @navita/css@0.0.9

## 0.0.8

### Patch Changes

- 5d03858: add description and keywords to packages
- Updated dependencies [5d03858]
  - @navita/core@0.0.8
  - @navita/css@0.0.8

## 0.0.7

### Patch Changes

- 96e9cee: Initial public release
- Updated dependencies [96e9cee]
  - @navita/core@0.0.7
  - @navita/css@0.0.7
