import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSecureToken } from '@/lib/security';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check if user is authenticated (host)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { propertyId, guestName, checkinDate, checkoutDate } = await req.json();

        if (!propertyId || !checkinDate || !checkoutDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify property exists
        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('id, slug, name')
            .eq('id', propertyId)
            .single();

        if (propertyError || !property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const accessToken = generateSecureToken();

        // Calculate access windows (2 days before - 2 days after)
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkoutDate);

        const validFrom = new Date(checkin);
        validFrom.setDate(validFrom.getDate() - 2);

        const validUntil = new Date(checkout);
        validUntil.setDate(validUntil.getDate() + 2);
        validUntil.setHours(23, 59, 59, 999); // Until end of the day

        const { error: insertError } = await supabase
            .from('guest_access_tokens')
            .insert({
                property_id: propertyId,
                guest_name: guestName || 'Invitado',
                access_token: accessToken,
                valid_from: validFrom.toISOString(),
                valid_until: validUntil.toISOString(),
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                is_active: true
            });

        if (insertError) {
            console.error('[GUEST_ACCESS] Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to create access token' }, { status: 500 });
        }

        // Return the token and the access URL
        const slugOrId = property.slug || property.id;
        return NextResponse.json({
            token: accessToken,
            url: `/${slugOrId}?token=${accessToken}`
        });

    } catch (error: any) {
        console.error('[GUEST_ACCESS] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
