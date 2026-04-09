// ─── app/api/manual-quality/list/route.ts ──────────────────────────────────
// Lista los manuales de una propiedad para el quality test script.
// Acepta: (a) service role key (dev scripts) o (b) guest access token válido.

import { createEdgeAdminClient } from '@/lib/supabase/edge';

export const runtime = 'nodejs';

async function isAuthorized(token: string, propertyId: string, supabase: any): Promise<boolean> {
    // Opción A: service role key (para scripts de desarrollo)
    if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) return true;

    // Opción B: guest access token válido para esta propiedad
    const { data } = await supabase
        .from('guest_access_tokens')
        .select('property_id')
        .eq('token', token)
        .eq('property_id', propertyId)
        .gt('expires_at', new Date().toISOString())
        .single();
    return !!data;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
        return new Response(JSON.stringify({ error: 'propertyId required' }), { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401 });
    }

    try {
        const supabase = createEdgeAdminClient();

        if (!await isAuthorized(token, propertyId, supabase)) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 403 });
        }

        const { data: manuals, error } = await supabase
            .from('property_manuals')
            .select('id, appliance_name, brand, model, manual_content, metadata, created_at')
            .eq('property_id', propertyId)
            .order('appliance_name');

        if (error) throw error;

        return new Response(JSON.stringify({ manuals: manuals || [] }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
