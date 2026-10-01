import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Cloudinary is the only remote source; the loader rewrites these URLs
    // to resize at the CDN rather than shipping originals.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }],
  },
  typedRoutes: true,
}

export default nextConfig
