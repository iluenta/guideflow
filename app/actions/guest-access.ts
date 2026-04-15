'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSecureToken } from '@/lib/security'
import { getTenantId } from '@/app/actions/properties'
import { addDays, subDays } from 'date-fns'
import { revalidatePath } from 'next/cache'

/**
 * Creates a unique access token for a guest reservation.
 * Window: check-in - 2 days to check-out + 2 days.
 */
export async function createGuestAccess(params: {
    propertyId: string;
    guestName: string;
    guestEmail?: string;
    checkinDate: string;
    checkoutDate: string;
    bookingId?: string;
}) {
    const { propertyId, guestName, guestEmail, checkinDate, checkoutDate, bookingId } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // 1. Verify property ownership (via tenant_id from profile — authoritative source)
    const tenant_id = await getTenantId(supabase, user)
    if (!tenant_id) throw new Error('No autorizado')

    const { data: property, error: propErr } = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .eq('tenant_id', tenant_id)
        .single()

    if (propErr || !property) throw new Error('Propiedad no encontrada o sin permiso')

    // 2. Generate secure token
    const accessToken = generateSecureToken(12) // Format: a8f3k2m9p1x7 (32 is too long for easy reading, 12 is enough for 36^12)

    // 3. Calculate temporal window
    const validFrom = subDays(new Date(checkinDate), 2).toISOString()
    const validUntil = addDays(new Date(checkoutDate), 2).toISOString()

    // 4. Insert token
    const { data, error } = await supabase
        .from('guest_access_tokens')
        .insert({
            property_id: propertyId,
            tenant_id: tenant_id,
            access_token: accessToken,
            guest_name: guestName,
            guest_email: guestEmail,
            checkin_date: checkinDate,
            checkout_date: checkoutDate,
            booking_id: bookingId,
            valid_from: validFrom,
            valid_until: validUntil,
            daily_chat_limit: 50
        })
        .select()
        .single()

    if (error) {
        console.error('[GUEST-ACCESS] Error creating token:', error.message)
        throw new Error('Error al generar el acceso')
    }

    const guideUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/g/${accessToken}`

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return {
        accessToken,
        guideUrl,
        data
    }
}

/**
 * Revokes access for a guest immediately.
 */
export async function revokeGuestAccess(tokenId: string, propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
        .from('guest_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('property_id', propertyId)

    if (error) throw new Error('Error al revocar el acceso')

    revalidatePath(`/dashboard/properties/${propertyId}`)
}
