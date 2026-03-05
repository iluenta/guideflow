export default function supabaseLoader({
    src,
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}) {
    // Check if it's a Supabase storage URL
    if (src.includes('supabase.co/storage/v1/object/public/')) {
        const baseUrl = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
        return `${baseUrl}?width=${width}&quality=${quality || 75}&resize=cover`
    }

    // For other URLs (like Unsplash), they often have their own resize params,
    // but if not, just returning the original is a safe fallback for the loader.
    return src
}
