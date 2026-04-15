// ─── app/api/manual-quality/list/route.ts ──────────────────────────────────
// Lista los manuales de una propiedad para el quality test script.
// Acepta: guest access token válido (Bearer). Los scripts de dev deben generar un token de invitado.

import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { validateAccessToken } from '@/lib/security';

export const runtime = 'nodejs';

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

        const authResult = await validateAccessToken(supabase, token, propertyId);
        if (!authResult.valid) {
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
