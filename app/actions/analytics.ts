'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGuestChats(propertyId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
        .from('guest_chats')
        .select(`
            id,
            guest_session_id,
            property_id,
            messages,
            created_at,
            updated_at,
            properties (
                name
            )
        `)
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
