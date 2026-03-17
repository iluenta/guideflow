import bundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // El loader ahora devuelve /_next/image?url=... en lugar de la URL
    // directa de Supabase, así Vercel puede cachear en CDN edge.
    loaderFile: './lib/image-loader.ts',

    // Cuánto tiempo cachea Vercel las imágenes optimizadas en su CDN.
    // 7 días: las imágenes hero no cambian frecuentemente.
    minimumCacheTTL: 604800,

    // Formatos modernos — Vercel servirá AVIF a navegadores compatibles,
    // WebP al resto. Ahorro adicional de ~30% sobre JPEG.
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
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
