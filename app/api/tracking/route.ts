import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { propertyId, guestSessionId, section } = await req.json();

        if (!propertyId || !section) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createEdgeAdminClient();

        const { error } = await supabase.from('guide_section_views').insert({
            property_id: propertyId,
            guest_session_id: guestSessionId,
            section: section,
            viewed_at: new Date().toISOString()
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
