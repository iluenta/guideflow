'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/supabase/get-tenant-id'

export async function getGuestChats(propertyId?: string) {
    const supabase = await createClient()
    const { tenant_id } = await requireProfile(supabase)

    let query = supabase
        .from('guest_chats')
        .select(`
            id,
            guest_session_id,
            property_id,
            messages,
            language,
            message_count,
            session_duration_seconds,
            created_at,
            updated_at,
            properties (
                name
            )
        `)
        .eq('tenant_id', tenant_id)
        .order('updated_at', { ascending: false })

    if (propertyId && propertyId !== 'all') {
        query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching guest chats:', error.message)
        return []
    }

    return data
}
