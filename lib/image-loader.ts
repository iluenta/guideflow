/**
 * Image loader para Next.js + Supabase Storage.
 *
 * PROBLEMA ANTERIOR:
 *   El loader devolvía directamente la URL de Supabase Image Transform
 *   (/render/image/public/...). Esto funciona, pero Vercel no cachea
 *   esas URLs en su CDN edge — cada visita viaja hasta Stockholm.
 *
 * SOLUCIÓN:
 *   Devolver una URL relativa /_next/image?url=...&w=...&q=...
 *   Así la petición pasa por el optimizador de Vercel, que:
 *     1. Redimensiona y convierte a WebP/AVIF
 *     2. Cachea el resultado en el edge node más cercano al usuario
 *     3. Segunda visita: ~50ms desde CDN en lugar de ~3,5s desde Stockholm
 *
 * IMPORTANTE: Para que esto funcione, la URL de Supabase debe estar
 * en remotePatterns de next.config.js (ya está configurado).
 */
export default function supabaseLoader({
    src,
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}) {
    // URLs relativas o de datos — devolver tal cual
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
        return src
    }

    // URLs de Supabase Storage — pasar por el optimizador de Vercel
    // Vercel descarga la imagen original de Supabase, la optimiza,
    // la convierte a WebP y la cachea en su CDN edge (minimumCacheTTL: 7 días)
    if (src.includes('supabase.co/storage/v1/object/public/')) {
        const encoded = encodeURIComponent(src)
        return `/_next/image?url=${encoded}&w=${width}&q=${quality || 75}`
    }

    // Unsplash — ya tiene su propio CDN rápido, pasar parámetros directamente
    if (src.includes('images.unsplash.com')) {
        const url = new URL(src)
        url.searchParams.set('w', String(width))
        url.searchParams.set('q', String(quality || 75))
        url.searchParams.set('auto', 'format')
        url.searchParams.set('fit', 'crop')
        return url.toString()
    }

    // Cualquier otra URL externa — pasar por Vercel también
    const encoded = encodeURIComponent(src)
    return `/_next/image?url=${encoded}&w=${width}&q=${quality || 75}`
}