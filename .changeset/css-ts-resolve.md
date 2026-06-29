---
"@navita/core": patch
---

Fix module resolution for the `.css.ts` theme convention. The fallback resolver
(enhancedResolve) now also tries `.ts/.mts/.cts/.tsx/.jsx`, so an
`import "../styles/theme.css"` whose file is `theme.css.ts` resolves. Previously it
threw "Failed to resolve dependency" under rolldown / Vite 8, where the bundler's
`this.resolve` returns null for that request and the fallback couldn't append `.ts`.
