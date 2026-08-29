import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { hostname: '76.13.134.189' },
    ],
  },
}

export default nextConfig
