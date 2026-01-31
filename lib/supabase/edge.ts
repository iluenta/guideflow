import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Lightweight client compatible with Edge Runtime.
 * Uses ANON_KEY by default.
 */
export const createEdgeClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('[EDGE-CLIENT] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    return createSupabaseClient(url, key);
}

/**
 * Admin client compatible with Edge Runtime.
 * Uses SERVICE_ROLE_KEY to bypass RLS.
 * USE WITH CAUTION: Only for backend/security routes.
 */
export const createEdgeAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('[EDGE-ADMIN] CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY or URL');
        // We throw a clear error to avoid 500 without explanation in Vercel logs
        throw new Error('[EDGE-ADMIN] Missing SUPABASE_SERVICE_ROLE_KEY or URL');
    }

    return createSupabaseClient(url, key);
}
