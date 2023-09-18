const { createNavitaStylePlugin } = require("@navita/next-plugin");
const { withContentlayer } = require('next-contentlayer');
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = createNavitaStylePlugin({
  singleCssFile: false,
})(
  withContentlayer(nextConfig)
);
