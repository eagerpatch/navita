---
"@navita/vite-plugin": patch
---

Fix alias imports (e.g. `@/lib/theme`) failing to resolve during style evaluation under rolldown/Vite 8. The renderer's resolver closure captured the `buildStart` plugin context; rolldown rejects `this.resolve` calls on a stale hook context, so every bundler-side resolution silently fell through to the enhanced-resolve fallback, which doesn't know the bundler's aliases. The resolver now uses the most recent live plugin context (refreshed by `transform`).
