/**
 * Loader passthrough.
 *
 * loaderFile fue eliminado de next.config.js para que Vercel gestione
 * la optimización y caché de imágenes directamente en su CDN edge.
 *
 * Este archivo se mantiene para no romper los imports de `supabaseLoader`
 * en los componentes (Fase11Welcome, UrbanThemeHome, etc.).
 * Puedes ir eliminando `loader={supabaseLoader}` de cada <Image> de forma
 * progresiva — no rompe nada tenerlo con esta implementación.
 */
export default function supabaseLoader({
    src,
}: {
    src: string
    width: number
    quality?: number
}) {
    return src
}