# @navita/vitest

## 3.0.0-next.2

### Patch Changes

- @navita/adapter@3.0.0-next.2
- @navita/engine@3.0.0-next.2

## 3.0.0-next.1

### Patch Changes

- @navita/adapter@3.0.0-next.1
- @navita/engine@3.0.0-next.1

## 3.0.0-next.0

### Major Changes

- 3df5c31: Navita v3 — unified versioning. The whole suite now releases in lockstep at a single version (changesets `fixed` group). This v3 line ships the modernized toolchain (OXC extraction, Vitest, Biome, tsdown, TypeScript 6) and the package changes (`@navita/swc` → `@navita/extraction`, the new `@navita/vitest`, and `@navita/jest` restored as a jest integration).

### Minor Changes

- bb84c13: **`@navita/vitest`: new package.** A Vitest setup integration for Navita — import
  it as a `setupFiles` entry (or `import "@navita/vitest"`) and every test gets a
  fresh `Engine` wired into the adapter via `beforeEach`, so `@navita/css` styles
  resolve deterministically per test.

  **`@navita/jest`: restored to a genuine Jest integration.** On this branch the
  package had been converted to a Vitest-based setup; this restores its published
  Jest behavior — it uses the global `beforeEach` (Jest's globals, typed via
  `@types/jest`) and no longer depends on `vitest`. Vitest users should switch to
  the new `@navita/vitest` package.

### Patch Changes

- Updated dependencies [30ead96]
- Updated dependencies [3df5c31]
  - @navita/engine@3.0.0-next.0
  - @navita/adapter@3.0.0-next.0
