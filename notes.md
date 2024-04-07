Here's the app layer rule:
https://github.com/vercel/next.js/blob/f6baf61b6167b5bf29060acdac53e29bcaa727f6/packages/next/src/build/webpack/config/blocks/css/index.ts#L264

This is for adding MiniCssPlugin:
https://github.com/vercel/next.js/blob/f6baf61b6167b5bf29060acdac53e29bcaa727f6/packages/next/src/build/webpack/config/blocks/css/index.ts#L589

Here's the next-flight-css-loader:
https://github.com/vercel/next.js/blob/f6baf61b6167b5bf29060acdac53e29bcaa727f6/packages/next/src/build/webpack/loaders/next-flight-css-loader.ts

Here's next.js lightningscss-loader:
https://github.com/vercel/next.js/blob/f6baf61b6167b5bf29060acdac53e29bcaa727f6/packages/next/src/build/webpack/loaders/lightningcss-loader/README.md

Webpack Layer names:
https://github.com/vercel/next.js/blob/a1e5d0b06d33f61912939b9bed1cc158fce4b9c6/packages/next/src/lib/constants.ts#L110

Webpack eager mode:
https://github.com/vercel/next.js/blob/14c8900e70db987f7a653d225daec3a9578aefba/packages/next/src/build/webpack/loaders/next-flight-client-entry-loader.ts#L52
