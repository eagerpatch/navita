const { createNavitaStylePlugin } = require("@navita/next-plugin");
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Content and MDX compilation run in Node at build time, don't bundle them
  serverExternalPackages: ['@qino/cms', 'prettier', 'rehype-pretty-code'],
  webpack(config, { isServer }) {
    if (isServer) {
      // Workspace package, so `serverExternalPackages` doesn't match it. Load the
      // ESM build: the CJS build of @navita/engine breaks on @emotion/hash in Node
      config.externals.push({
        '@navita/core/createRenderer': 'module @navita/core/createRenderer',
      });
    }

    return config;
  },
};

module.exports = createNavitaStylePlugin({
  singleCssFile: false,
})(nextConfig);
