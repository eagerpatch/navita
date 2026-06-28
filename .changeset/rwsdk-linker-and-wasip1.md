---
"@navita/vite-plugin": patch
"@navita/swc": patch
---

Two fixes for building under Vite 8 (Rolldown):

- **vite-plugin:** skip the `transform` hook during RedwoodSDK's worker "linker"
  pass (`RWSDK_BUILD_PASS=linker`). That pass re-feeds the already-built worker
  bundle through the plugin pipeline; its navita styles are already extracted and
  it imports runtime-only specifiers (`node:*`, `cloudflare:*`, `virtual:*`) that
  navita can neither resolve nor evaluate at build time, so re-processing it
  crashed the build.
- **swc:** migrate the wasm build target from the removed `wasm32-wasi` to
  `wasm32-wasip1` (identical wasi-preview1 ABI) so the plugin compiles on current
  Rust toolchains, and bump the `time` crate in `Cargo.lock` to a version that
  builds on Rust ≥1.80.
