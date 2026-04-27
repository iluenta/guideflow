// ─── app/api/manual-quality/regenerate-v2/route.ts ─────────────────────────
// Regenera un manual con el pipeline V2 sin guardarlo en DB.
// Solo devuelve el contenido generado para comparación de calidad.
// Acepta: guest access token válido (Bearer). Los scripts de dev deben generar un token de invitado.

import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { generateManualForQualityTest } from '@/app/actions/ai-ingestion';
import { validateAccessToken } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const { propertyId, manualId } = body;
    if (!propertyId || !manualId) {
        return new Response(JSON.stringify({ error: 'propertyId and manualId required' }), { status: 400 });
    }

    try {
        const supabase = createEdgeAdminClient();

        const authResult = await validateAccessToken(supabase, token, propertyId);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 403 });
        }

        // Fetch el manual existente para obtener los datos del aparato
        const { data: manual, error: fetchErr } = await supabase
            .from('property_manuals')
            .select('id, appliance_name, brand, model, metadata')
            .eq('id', manualId)
            .eq('property_id', propertyId)
            .single();

        if (fetchErr || !manual) {
            return new Response(JSON.stringify({ error: 'Manual not found' }), { status: 404 });
        }

        // Reconstruir el análisis básico desde metadata
        const basicAnalysis = manual.metadata?.visual || {
            appliance_type: manual.appliance_name,
            brand: manual.brand,
            model: manual.model,
        };

        // Usar la imagen del appliance_images si existe
        const { data: imageRecord } = await supabase
            .from('appliance_images')
            .select('image_url')
            .eq('manual_id', manualId)
            .limit(1)
            .single();

        const imageUrl = imageRecord?.image_url || '';

        const content = await generateManualForQualityTest(imageUrl, basicAnalysis, { propertyId, tenantId: authResult.access?.tenant_id });

        return new Response(JSON.stringify({ content, chars: content.length }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[REGEN-V2]', err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
