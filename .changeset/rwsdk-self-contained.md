---
"@navita/vite-plugin": patch
---

`navitaRwsdk` now works standalone — no downstream companion plugin needed to get
styles under RedwoodSDK. Three rwsdk-specific gaps are fixed:

- **dev CSS serving:** rwsdk evaluates the resolved `.css` module in its worker
  env, which has no CSS pipeline and runs JS import-analysis over the raw CSS —
  so `GET /virtual:navita.css` 500'd and the app rendered unstyled. `navitaRwsdk`
  now answers that request from a `configureServer` middleware (before Vite's
  transform middleware), keeping the CSS out of the worker env.
- **style HMR:** the `css-update` was gated on the virtual module being in the
  graph; once the stylesheet is middleware-served it never enters the graph, so
  edits needed a full reload. The notification now fires even when the module is
  absent (unchanged for a normal Vite app, where it's present).
- **production emit:** `renderChunk` emitted `navita.css` via a global one-shot
  latch that rwsdk's early throwaway worker pass — which runs while the shared
  renderer is still empty — consumed, so the real client build shipped nothing.
  Emission is now gated to the `client` build environment (CSS is a client
  asset) and only latches once a non-empty stylesheet is emitted, so the empty
  worker pass no longer starves the client build. This also makes plain
  `navita()` emit the stylesheet in the client build rather than whichever
  environment happened to render first.
