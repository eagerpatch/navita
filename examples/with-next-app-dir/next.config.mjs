import { createNavitaStylePlugin } from '@navita/next-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default createNavitaStylePlugin()(nextConfig);
