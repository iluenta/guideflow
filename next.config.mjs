import bundleAnalyzer from '@next/bundle-analyzer'

// Allow Next.js to fetch Google Fonts at build time behind corporate SSL proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ]
    }]
  },
  images: {
    // SIN loaderFile: Vercel gestiona optimización y caché directamente.
    // Con loaderFile activo Vercel delega la URL al loader y no cachea
    // el resultado en su CDN edge — cada visita va a Supabase Stockholm.
    // Sin loaderFile: primera visita optimiza y cachea, resto ~100ms desde CDN.

    minimumCacheTTL: 604800, // 7 días — imágenes hero cambian poco
    formats: ['image/avif', 'image/webp'],

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
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(),
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)