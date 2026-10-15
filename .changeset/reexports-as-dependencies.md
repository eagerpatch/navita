---
"@navita/extraction": patch
---

`esmToAmd` binds re-exports (`export { a } from "x"`, `export * from "x"`, `export * as ns from "x"`) as AMD module dependencies instead of routing them through the `require` parameter. `@navita/core`'s `require` is an async import shim, so every re-exported name used to come back `undefined` — a `/css` barrel such as `export { style } from "@navita/css"` evaluated to "style is not a function" once a bundler collapsed it into a bare re-export. Entry points drop re-exports entirely, since their exports are never read.
