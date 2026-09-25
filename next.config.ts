import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev overlay badge sits in the corner and pollutes reference screenshots.
  devIndicators: false,
  images: {
    // All media is mirrored into /public/media, so next/image optimizes local files
    // and emits the same srcset ladder the original site served from /_next/image.
    formats: ['image/webp'],
  },
}

export default nextConfig
