---
"@navita/engine": patch
"@navita/webpack-plugin": patch
"@navita/next-plugin": patch
"@navita/core": patch
"@navita/adapter": patch
---

Correctness fixes from an audit (each covered by new tests):

- **engine**: paren/bracket-aware selector-list splitting (grouped `:is()/:not()`, attribute commas); broadened nested-selector detection (`+`, `~`, descendant, `.parent &` context); reopen repeated inner at-rule wrappers when an outer at-rule changes; tighter CSS-variable normalization (no longer corrupts strings containing `--`); skip `px` on numeric custom properties.
- **webpack-plugin**: fix the loader success path (a `sourceMap` redeclaration made it a `SyntaxError`); reuse-safe hash function (a single `crypto.Hash` was reused after `.digest()`); HMR now appends the new `<link>` instead of re-appending the old one.
- **next-plugin**: guard cache-path resolution when the webpack cache isn't filesystem-backed (was a `TypeError` during config eval).
- **core**: scope renderer caches per-renderer to fix cross-renderer CSS leakage; remove a dead `catch`.
- **adapter**: correct `addStaticCss` return type.
