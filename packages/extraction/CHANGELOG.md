# @navita/swc

## 3.0.0-next.2

## 3.0.0-next.1

## 3.0.0-next.0

### Major Changes

- 3df5c31: Navita v3 — unified versioning. The whole suite now releases in lockstep at a single version (changesets `fixed` group). This v3 line ships the modernized toolchain (OXC extraction, Vitest, Biome, tsdown, TypeScript 6) and the package changes (`@navita/swc` → `@navita/extraction`, the new `@navita/vitest`, and `@navita/jest` restored as a jest integration).

### Minor Changes

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
