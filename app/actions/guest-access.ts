'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSecureToken } from '@/lib/security'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { can, type TenantRole } from '@/lib/permissions'
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
    const { tenant_id, tenant_role } = await requireProfile(supabase)
    
    if (!can(tenant_role as TenantRole, 'properties', 'edit')) {
        throw new Error('No tienes permisos para generar accesos')
    }

    const { data: property, error: propErr } = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .eq('tenant_id', tenant_id)
        .single()

    if (propErr || !property) throw new Error('Propiedad no encontrada o sin permiso')

    // 2. Generate secure token
    const accessToken = generateSecureToken(12)

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
    const { tenant_id, tenant_role } = await requireProfile(supabase)

    if (!can(tenant_role as TenantRole, 'properties', 'edit')) {
        throw new Error('No tienes permisos para revocar accesos')
    }

    const { error } = await supabase
        .from('guest_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('property_id', propertyId)
        .eq('tenant_id', tenant_id)

    if (error) throw new Error('Error al revocar el acceso')

    revalidatePath(`/dashboard/properties/${propertyId}`)
}
