---
"@navita/extraction": minor
"@navita/vite-plugin": patch
---

**`@navita/extraction`: rewritten in pure JavaScript on top of OXC**, replacing the Rust
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
