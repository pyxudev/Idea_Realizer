/** @type {import('next').NextConfig} */
const nextConfig = {
  // standaloneをやめる → 通常のnpm startで動かす
  transpilePackages: ['@ai-dashboard/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};
module.exports = nextConfig;
