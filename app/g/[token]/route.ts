import { createClient } from '@/lib/supabase/server';
import { validateAccessToken } from '@/lib/security';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    const supabase = await createClient();

    // 1. Validate the token
    const { valid, access, reason } = await validateAccessToken(supabase, token);

    if (!valid || !access) {
        console.error(`[GUEST_ACTIVATION] Invalid token: ${token}, reason: ${reason}`);
        return redirect(`/access-denied?reason=${reason || 'invalid'}`);
    }

    // 2. Get the property slug
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('slug')
        .eq('id', access.property_id)
        .single();

    if (propError || !property?.slug) {
        console.error(`[GUEST_ACTIVATION] Property not found or slug missing for propertyId: ${access.property_id}`);
        return redirect('/access-denied?reason=property_not_found');
    }

    // 3. Set the secure cookie
    // Cookie name matches the one expected in app/[slug]/page.tsx: gf_token_${slug}
    const cookieStore = await cookies();
    const expires = access.valid_until ? new Date(access.valid_until) : undefined;

    cookieStore.set(`gf_token_${property.slug}`, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expires,
    });

    console.log(`[GUEST_ACTIVATION] Access granted for ${access.guest_name} at /${property.slug}`);

    // 4. Redirect to the slug page (no token in URL!)
    return redirect(`/${property.slug}`);
}
