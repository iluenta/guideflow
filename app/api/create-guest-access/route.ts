import { NextResponse } from 'next/server';
import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { logger } from '@/lib/logger';
import { generateSecureToken } from '@/lib/security';

export async function POST(req: Request) {
    try {
        // Read standard cookies to verify who called the API
        const { createClient } = await import('@/lib/supabase/server');
        const supabaseAuth = await createClient();
        
        // Check if user is authenticated (host)
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Use admin client for DB inserts across tenant if needed
        const supabaseAdmin = createEdgeAdminClient();

        const { propertyId, guestName, checkinDate, checkoutDate, language } = await req.json();

        if (!propertyId || !checkinDate || !checkoutDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Security check: Property belongs to the host's tenant
        const { data: profile } = await supabaseAdmin.from('profiles').select('tenant_id').eq('id', user.id).single();
        const tenant_id = profile?.tenant_id;

        if (!tenant_id) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
        }

        // Verify property exists AND belongs to this tenant
        const { data: property, error: propertyError } = await supabaseAdmin
            .from('properties')
            .select('id, slug, name, tenant_id')
            .eq('id', propertyId)
            .eq('tenant_id', tenant_id)
            .single();

        if (propertyError || !property) {
            logger.warn(`[GUEST_ACCESS] Unauthorized token generation attempt blocked`);
            return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
        }

        // Security check: Property MUST have a slug configured
        if (!property.slug) {
            return NextResponse.json({
                error: 'slug_missing',
                message: 'La propiedad no tiene un slug configurado. Por favor, configura el slug en los ajustes de la propiedad antes de generar accesos para huéspedes.'
            }, { status: 400 });
        }

        const accessToken = generateSecureToken();

        // Calculate access windows (UTC based)
        // From: 2 days before check-in (UTC 00:00:00)
        // Until: End of checkout day (UTC 23:59:59) - Grace period reduced from 2 days to 0
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkoutDate);

        const validFrom = new Date(checkin);
        validFrom.setUTCDate(validFrom.getUTCDate() - 2);
        validFrom.setUTCHours(0, 0, 0, 0);

        const validUntil = new Date(checkout);
        validUntil.setUTCHours(23, 59, 59, 999);

        const { error: insertError } = await supabaseAdmin
            .from('guest_access_tokens')
            .insert({
                property_id: propertyId,
                tenant_id: property.tenant_id, // Store for RLS/Auditing
                guest_name: guestName || 'Invitado',
                access_token: accessToken,
                valid_from: validFrom.toISOString(),
                valid_until: validUntil.toISOString(),
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                language: language || 'es',
                is_active: true
            });

        if (insertError) {
            logger.error('[GUEST_ACCESS] Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to create access token' }, { status: 500 });
        }

        // Return the token and the activation URL
        return NextResponse.json({
            token: accessToken,
            url: `/g/${accessToken}`
        });

    } catch (error: any) {
        logger.error('[GUEST_ACCESS] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
