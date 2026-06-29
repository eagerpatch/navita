# @navita/next-plugin

## 3.0.0-next.1

### Patch Changes

- @navita/webpack-plugin@3.0.0-next.1

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
  - @navita/webpack-plugin@3.0.0-next.0

## 0.4.4

### Patch Changes

- @navita/webpack-plugin@0.4.4

## 0.4.3

### Patch Changes

- @navita/webpack-plugin@0.4.3

## 0.4.2

### Patch Changes

- @navita/webpack-plugin@0.4.2

## 0.4.1

### Patch Changes

- @navita/webpack-plugin@0.4.1

## 0.4.0

### Minor Changes

- b0976b2: This enables more usage of the caches in the rendering engine. It allows external tooling to hook into the navita process to do analysis or extraction for other tools

### Patch Changes

- Updated dependencies [b0976b2]
  - @navita/webpack-plugin@0.4.0

## 0.3.0

### Minor Changes

- 7c50e30: Added functionality to disable the usage of webpacks cache via the plugins constructor. Added a custom cache solution for next.js that uses a single text file to store the cache between compilations.

### Patch Changes

- Updated dependencies [7c50e30]
  - @navita/webpack-plugin@0.3.0

## 0.2.0

### Minor Changes

- 9d3109a: Improve support for the next.js plugin. This ensures that we don't add bytes to the page manifest when it's not needed, and differentiates navita caches between builds.

### Patch Changes

- Updated dependencies [9d3109a]
  - @navita/webpack-plugin@0.2.0

## 0.1.3

### Patch Changes

- @navita/webpack-plugin@0.1.3

## 0.1.2

### Patch Changes

- @navita/webpack-plugin@0.1.2

## 0.1.1

### Patch Changes

- @navita/webpack-plugin@0.1.1

## 0.1.0

### Minor Changes

- a09e673: better cache handling when navita is used

### Patch Changes

- Updated dependencies [a09e673]
- Updated dependencies [1f09b35]
  - @navita/webpack-plugin@0.1.0

## 0.0.13

### Patch Changes

- @navita/webpack-plugin@0.0.13

## 0.0.12

### Patch Changes

- 4dbddc0: fix build script so tree shaking actually works when consuming packages
- Updated dependencies [4dbddc0]
  - @navita/webpack-plugin@0.0.12

## 0.0.11

### Patch Changes

- 974766e: Prevent library from being bundled to facilitate better tree shaking
- Updated dependencies [974766e]
  - @navita/webpack-plugin@0.0.11

## 0.0.10

### Patch Changes

- @navita/webpack-plugin@0.0.10

## 0.0.9

### Patch Changes

- Updated dependencies [a52048a]
  - @navita/webpack-plugin@0.0.9

## 0.0.8

### Patch Changes

- 5d03858: add description and keywords to packages
- Updated dependencies [5d03858]
  - @navita/webpack-plugin@0.0.8

## 0.0.7

### Patch Changes

- 96e9cee: Initial public release
- Updated dependencies [96e9cee]
  - @navita/webpack-plugin@0.0.7
