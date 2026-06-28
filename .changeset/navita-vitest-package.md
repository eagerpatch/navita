---
"@navita/vitest": minor
"@navita/jest": patch
---

**`@navita/vitest`: new package.** A Vitest setup integration for Navita — import
it as a `setupFiles` entry (or `import "@navita/vitest"`) and every test gets a
fresh `Engine` wired into the adapter via `beforeEach`, so `@navita/css` styles
resolve deterministically per test.

**`@navita/jest`: restored to a genuine Jest integration.** On this branch the
package had been converted to a Vitest-based setup; this restores its published
Jest behavior — it uses the global `beforeEach` (Jest's globals, typed via
`@types/jest`) and no longer depends on `vitest`. Vitest users should switch to
the new `@navita/vitest` package.
