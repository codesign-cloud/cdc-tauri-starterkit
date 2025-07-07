/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  // Ensure static export works properly for Tauri
  generateEtags: false,
  poweredByHeader: false,
  experimental: {
    //esmExternals: 'loose',
  },
}

module.exports = nextConfig