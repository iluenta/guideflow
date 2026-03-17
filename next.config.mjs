import bundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // FASE 19: Enable optimization and configure allowed domains
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
