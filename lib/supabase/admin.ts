import { createClient } from '@supabase/supabase-js'

/**
 * Client using SERVICE_ROLE_KEY to bypass RLS.
 * This file is safe to use in Middleware because it doesn't import 'next/headers'.
 */
export const createAdminClient = async () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}
