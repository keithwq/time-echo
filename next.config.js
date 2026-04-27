/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // 输出 standalone 模式，用于 Docker 部署
  output: 'standalone',
  // 禁用实验性功能以避免警告
  experimental: {
    // 禁用某些实验性功能
  },
};

module.exports = nextConfig;
