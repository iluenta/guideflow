import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { validateAccessToken, generateDeviceFingerprint } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { propertyId, guestSessionId, section, accessToken, timeSpent } = await req.json();

        if (!propertyId || !section || !accessToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createEdgeAdminClient();

        const authResult = await validateAccessToken(supabase, accessToken, propertyId);
        if (!authResult.valid) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // Capturar datos del dispositivo desde los headers
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        const ua = req.headers.get('user-agent') ?? 'unknown';
        const fingerprint = await generateDeviceFingerprint(ip, ua);

        const { error } = await supabase.from('guide_section_views').insert({
            property_id: propertyId,
            guest_session_id: guestSessionId,
            section,
            viewed_at: new Date().toISOString(),
            time_spent_seconds: typeof timeSpent === 'number' && timeSpent > 0 ? timeSpent : null,
            access_token: accessToken,
            device_fingerprint: fingerprint,
            user_agent: ua,
            ip_address: ip,
        });

        if (error) {
            console.error('[TRACKING] Error inserting section view:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[TRACKING] Unexpected error:', err.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
