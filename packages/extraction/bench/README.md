# Extraction benchmark

Compares the old `@swc/core` wasm-plugin extraction against the new
`oxc-parser` + `magic-string` implementation.

The old path is installed in an isolated, git-ignored scratch dir:

```bash
mkdir -p bench/.old && cd bench/.old
npm init -y
npm i @navita/swc@0.1.0 @swc/core@1.3.63 find-cache-dir@3
```

Then build this package (`pnpm build`) and run:

```bash
node bench/benchmark.cjs [iterations]   # default 500
```
