![Navita Logo](https://navita.style/navita.svg)

Navita is a powerful CSS-in-JS library
that brings type-safe compile-time Atomic CSS-in-JS with zero runtime to your projects.

It allows you to easily style your components and apply themes without the need for any additional runtime dependencies.

With Navita, you can write clean and maintainable CSS in JavaScript, without sacrificing runtime performance.


🔥 &nbsp; All styles generated at build time — just like Sass, Less, etc.

✨ &nbsp; Minimal abstraction over standard CSS.

🦄 &nbsp; Works with any JS-based front-end framework — or even without one.

🎨 &nbsp; High-level theme system with support for simultaneous themes.

💪 &nbsp; Type-safe styles via [CSSType](https://github.com/frenic/csstype).

🌳 &nbsp; Co-locate your styles with your components — if you want to.

🛠 &nbsp; Integrations with popular bundlers such as Webpack, Vite, and Next.js.

---
🌐 [Check out the documentation site for setup guides, examples and API docs.](https://navita.style)

---

## Installation

To start using Navita in your project, simply follow these steps:

### Install Navita using npm:

```bash
npm install @navita/css --save
```

You'll also need to install the Navita integration for your preferred bundler.
Navita currently supports Webpack, Vite, and Next.js.

### Choose the integration for your preferred bundler:
#### If you are using Webpack, install the Webpack integration:

```bash
npm install @navita/webpack-plugin mini-css-extract-plugin --save-dev
```

Update your `webpack.config.js` file to include both MiniCssExtractPlugin and NavitaPlugin:

```javascript
const { NavitaPlugin } = require('@navita/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // Other webpack options,
  plugins: [
    new MiniCssExtractPlugin(),
    new NavitaPlugin(),
  ],
};
```

Read more about the Webpack integration in the [Webpack documentation](https://navita.style/integrations/webpack).

#### If you are using Vite, install the Vite integration:

```bash
npm install @navita/vite-plugin --save-dev
```

And add it to your `vite.config.js` file:

```typescript
import { defineConfig } from 'vite';
import { navita } from '@navita/vite-plugin';

export default defineConfig({
  plugins: [
    // Other plugins
    navita(/* Additional options */)
  ],
});
```

Read more about the Vite integration in the [Vite documentation](https://navita.style/integrations/vite).

##### If you are using Next.js, install the Next.js integration:

🚀 &nbsp; React Server Components support!

```bash
npm install @navita/next-plugin --save-dev
```

And add it to your `next.config.js` file:

```javascript
const { createNavitaStylePlugin } = require("@navita/next-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = createNavitaStylePlugin({
  // Additional options
})(nextConfig);
```

Read more about the Next.js integration in the [Next.js documentation](https://navita.style/integrations/next).

## Usage

The main entry point for Navita is the `style` function.
Make sure you read the reset of the documentation on
<https://navita.style> to learn more about the APIs.

```typescript
import { style } from '@navita/css';

const container = style({
  padding: '2rem',
  background: 'hotpink',
  color: 'white',
});

document.write(`
  <div class="${container}">
    Hello World!
  </div>
`);
```

That's it!

💡 Only references to the classNames will be included in the bundle.

> Note: Navita doesn't require special file extensions for your styles.
You can co-locate your CSS styles with your components.

## Documentation

For detailed documentation, examples, and usage guidelines,
please visit the official Navita website: <https://navita.style>

## Contributing

We welcome contributions from the community to make Navita even better!

## Thanks
* [Vanilla-Extract](https://vanilla-extract.style) and [Linaria](https://linaria.dev) for the inspiration and the great work on the CSS-in-JS ecosystem. 
* [Fela](https://fela.js.org) for the fantastic work on Atomic css-in-js.
* [Eagerpatch](https://eagerpatch.com) for giving us the space to do interesting work.
***

MIT Licensed—A project by [Eagerpatch](https://eagerpatch.com).\
Made with ❤️ by [zn4rk](https://github.com/zn4rk) and contributors.
