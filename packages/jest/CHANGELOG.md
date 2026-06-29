# @navita/jest

## 3.0.0-next.1

### Patch Changes

- @navita/adapter@3.0.0-next.1
- @navita/engine@3.0.0-next.1

## 3.0.0-next.0

### Major Changes

- 3df5c31: Navita v3 — unified versioning. The whole suite now releases in lockstep at a single version (changesets `fixed` group). This v3 line ships the modernized toolchain (OXC extraction, Vitest, Biome, tsdown, TypeScript 6) and the package changes (`@navita/swc` → `@navita/extraction`, the new `@navita/vitest`, and `@navita/jest` restored as a jest integration).

### Patch Changes

- bb84c13: **`@navita/vitest`: new package.** A Vitest setup integration for Navita — import
  it as a `setupFiles` entry (or `import "@navita/vitest"`) and every test gets a
  fresh `Engine` wired into the adapter via `beforeEach`, so `@navita/css` styles
  resolve deterministically per test.

  **`@navita/jest`: restored to a genuine Jest integration.** On this branch the
  package had been converted to a Vitest-based setup; this restores its published
  Jest behavior — it uses the global `beforeEach` (Jest's globals, typed via
  `@types/jest`) and no longer depends on `vitest`. Vitest users should switch to
  the new `@navita/vitest` package.

- Updated dependencies [30ead96]
- Updated dependencies [3df5c31]
  - @navita/engine@3.0.0-next.0
  - @navita/adapter@3.0.0-next.0

## 0.1.6

### Patch Changes

- Updated dependencies [6b568b7]
  - @navita/engine@0.2.2

## 0.1.5

### Patch Changes

- Updated dependencies [8e3a53a]
  - @navita/engine@0.2.1

## 0.1.4

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

## 0.0.13

### Patch Changes

- Updated dependencies [d52050b]
  - @navita/engine@0.0.13
  - @navita/adapter@0.0.11

## 0.0.12

### Patch Changes

- 4dbddc0: fix build script so tree shaking actually works when consuming packages
- Updated dependencies [4dbddc0]
  - @navita/adapter@0.0.11
  - @navita/engine@0.0.12

## 0.0.11

### Patch Changes

- 974766e: Prevent library from being bundled to facilitate better tree shaking
- Updated dependencies [974766e]
  - @navita/engine@0.0.11
  - @navita/adapter@0.0.10

## 0.0.10

### Patch Changes

- Updated dependencies [b02165f]
  - @navita/engine@0.0.10

## 0.0.9

### Patch Changes

- Updated dependencies [a52048a]
  - @navita/adapter@0.0.9
  - @navita/engine@0.0.9

## 0.0.8

### Patch Changes

- 5d03858: add description and keywords to packages
- Updated dependencies [5d03858]
  - @navita/adapter@0.0.8
  - @navita/engine@0.0.8

## 0.0.7

### Patch Changes

- 96e9cee: Initial public release
- Updated dependencies [96e9cee]
  - @navita/adapter@0.0.7
  - @navita/engine@0.0.7
