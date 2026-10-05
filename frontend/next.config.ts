import type { NextConfig } from "next";

const localWebpack: NonNullable<NextConfig['webpack']> = (config, { dev }) => {
  if (dev) {
    // Avoid PackFileCacheStrategy allocation spikes on the Windows launcher.
    // Rebuilds may take longer, but no persistent pack is read or serialized.
    config.cache = false;
    config.parallelism = 8;
  }
  return config;
};

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(process.env.LIVECRYPTO_LOCAL_DEV === 'true' ? { experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: ['wagmi', '@wagmi/core', 'viem', 'viem/chains', '@tanstack/react-query'],
  } } : {}),
  ...(process.env.LIVECRYPTO_LOCAL_DEV === 'true' ? { webpack: localWebpack } : {}),
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_INTERNAL_URL || 'http://localhost:8080'}/api/:path*` }];
  },
};

export default nextConfig;
