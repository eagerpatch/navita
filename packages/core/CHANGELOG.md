# @navita/core

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

- @navita/adapter@3.0.0-next.2
- @navita/engine@3.0.0-next.2
- @navita/extraction@3.0.0-next.2
- @navita/types@3.0.0-next.2

## 3.0.0-next.1

### Patch Changes

- 6537ac8: Fix module resolution for the `.css.ts` theme convention. The fallback resolver
  (enhancedResolve) now also tries `.ts/.mts/.cts/.tsx/.jsx`, so an
  `import "../styles/theme.css"` whose file is `theme.css.ts` resolves. Previously it
  threw "Failed to resolve dependency" under rolldown / Vite 8, where the bundler's
  `this.resolve` returns null for that request and the fallback couldn't append `.ts`.
  - @navita/adapter@3.0.0-next.1
  - @navita/engine@3.0.0-next.1
  - @navita/extraction@3.0.0-next.1
  - @navita/types@3.0.0-next.1

## 3.0.0-next.0

### Major Changes

- 3df5c31: Navita v3 — unified versioning. The whole suite now releases in lockstep at a single version (changesets `fixed` group). This v3 line ships the modernized toolchain (OXC extraction, Vitest, Biome, tsdown, TypeScript 6) and the package changes (`@navita/swc` → `@navita/extraction`, the new `@navita/vitest`, and `@navita/jest` restored as a jest integration).

### Patch Changes

- 30ead96: Correctness fixes from an audit (each covered by new tests):

  - **engine**: paren/bracket-aware selector-list splitting (grouped `:is()/:not()`, attribute commas); broadened nested-selector detection (`+`, `~`, descendant, `.parent &` context); reopen repeated inner at-rule wrappers when an outer at-rule changes; tighter CSS-variable normalization (no longer corrupts strings containing `--`); skip `px` on numeric custom properties.
  - **webpack-plugin**: fix the loader success path (a `sourceMap` redeclaration made it a `SyntaxError`); reuse-safe hash function (a single `crypto.Hash` was reused after `.digest()`); HMR now appends the new `<link>` instead of re-appending the old one.
  - **next-plugin**: guard cache-path resolution when the webpack cache isn't filesystem-backed (was a `TypeError` during config eval).
  - **core**: scope renderer caches per-renderer to fix cross-renderer CSS leakage; remove a dead `catch`.
  - **adapter**: correct `addStaticCss` return type.

- Updated dependencies [30ead96]
- Updated dependencies [3df5c31]
- Updated dependencies [f9f4aa5]
  - @navita/engine@3.0.0-next.0
  - @navita/adapter@3.0.0-next.0
  - @navita/extraction@3.0.0-next.0
  - @navita/types@3.0.0-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [6b568b7]
  - @navita/engine@0.2.2

## 1.0.0

### Major Changes

- c03767b: fix proper remix support in the vite plugin

## 0.2.1

### Patch Changes

- Updated dependencies [8e3a53a]
  - @navita/engine@0.2.1

## 0.2.0

### Minor Changes

- b0976b2: This enables more usage of the caches in the rendering engine. It allows external tooling to hook into the navita process to do analysis or extraction for other tools

### Patch Changes

- Updated dependencies [b0976b2]
  - @navita/engine@0.2.0

## 0.1.3

### Patch Changes

- Updated dependencies [38702de]
  - @navita/engine@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [addd59f]
  - @navita/engine@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [193546e]
  - @navita/engine@0.1.1

## 0.1.0

### Minor Changes

- a09e673: better cache handling when navita is used

### Patch Changes

- Updated dependencies [5661932]
- Updated dependencies [a09e673]
- Updated dependencies [dd728cc]
- Updated dependencies [02d1384]
- Updated dependencies [d069351]
  - @navita/engine@0.1.0
  - @navita/adapter@0.1.0
  - @navita/swc@0.1.0
  - @navita/types@0.1.0

## 0.0.13

### Patch Changes

- Updated dependencies [d52050b]
  - @navita/engine@0.0.13
  - @navita/types@0.0.11
  - @navita/adapter@0.0.11
  - @navita/swc@0.0.11

## 0.0.12

### Patch Changes

- 4dbddc0: fix build script so tree shaking actually works when consuming packages
- Updated dependencies [4dbddc0]
  - @navita/adapter@0.0.11
  - @navita/engine@0.0.12
  - @navita/swc@0.0.11
  - @navita/types@0.0.10

## 0.0.11

### Patch Changes

- 974766e: Prevent library from being bundled to facilitate better tree shaking
- Updated dependencies [974766e]
  - @navita/engine@0.0.11
  - @navita/swc@0.0.10
  - @navita/adapter@0.0.10
  - @navita/types@0.0.9

## 0.0.10

### Patch Changes

- b02165f: normalize creation of css vars
- Updated dependencies [b02165f]
  - @navita/engine@0.0.10

## 0.0.9

### Patch Changes

- a52048a: Replacing SWC-pass with MagicString
- Updated dependencies [a52048a]
  - @navita/adapter@0.0.9
  - @navita/engine@0.0.9
  - @navita/swc@0.0.9

## 0.0.8

### Patch Changes

- 5d03858: add description and keywords to packages
- Updated dependencies [5d03858]
  - @navita/adapter@0.0.8
  - @navita/engine@0.0.8
  - @navita/types@0.0.8
  - @navita/swc@0.0.8

## 0.0.7

### Patch Changes

- 96e9cee: Initial public release
- Updated dependencies [96e9cee]
  - @navita/adapter@0.0.7
  - @navita/engine@0.0.7
  - @navita/swc@0.0.7
  - @navita/types@0.0.7
