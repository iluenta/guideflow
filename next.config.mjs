import bundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: true },
    ]
  },
  async headers() {
    // Content-Security-Policy: defensa en profundidad frente a XSS e inyección de
    // recursos. Se permite 'unsafe-inline'/'unsafe-eval' en script-src porque Next.js
    // (hidratación) y Mapbox GL JS los necesitan sin un esquema de nonce; aun así la
    // política bloquea scripts de terceros, framing (clickjacking), <base> y objetos.
    // Hosts externos usados desde el navegador: Supabase (REST/Storage/Realtime) y
    // Mapbox (mapas de la landing y del wizard). Las APIs de IA/Places/SES se llaman
    // desde el servidor, así que NO necesitan aparecer en connect-src.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tiles.mapbox.com https://api.mapbox.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com",
      "worker-src 'self' blob:",
      "frame-src 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: csp },
          // HSTS: fuerza HTTPS durante 2 años en el dominio y subdominios. Vercel ya
          // sirve solo por HTTPS; esto lo hace explícito y habilita la lista preload.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // camera=(self): el check-in online necesita acceso a la cámara del propio
          // origen (escaneo de DNI/NIE/pasaporte en vivo, ver DocumentScanner). Sin
          // esto getUserMedia falla siempre, para cualquier huésped, en cualquier navegador.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ]
      },
      // Referrer-Policy en dos fuentes MUTUAMENTE EXCLUYENTES para no emitir la
      // cabecera duplicada (cuyo resultado sería no determinista).
      {
        // Todo excepto /check-in/*: política estándar.
        source: '/((?!check-in).*)',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // M-2: en /check-in/[slug]/[token] el token viaja en la URL. no-referrer
        // evita que se filtre por la cabecera Referer al seguir enlaces o cargar
        // recursos desde la página de check-in.
        source: '/check-in/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ]
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
    serverActions: {
      // Por defecto Next.js limita el body de una Server Action a 1MB — una
      // foto real de móvil (escaneo de DNI/pasaporte) lo supera fácilmente.
      // Se comprime en el cliente antes de enviarla (ver DocumentScanner),
      // pero dejamos margen aquí también. Vercel limita el body de una
      // función serverless a ~4.5MB, así que no subir de 4mb.
      bodySizeLimit: '4mb',
    },
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(),
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
