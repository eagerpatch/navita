# @navita/adapter

## 3.0.0-next.1

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

## 0.1.0

### Minor Changes

- a09e673: better cache handling when navita is used

## 0.0.11

### Patch Changes

- 4dbddc0: fix build script so tree shaking actually works when consuming packages

## 0.0.10

### Patch Changes

- 974766e: Prevent library from being bundled to facilitate better tree shaking

## 0.0.9

### Patch Changes

- a52048a: Replacing SWC-pass with MagicString

## 0.0.8

### Patch Changes

- 5d03858: add description and keywords to packages

## 0.0.7

### Patch Changes

- 96e9cee: Initial public release
