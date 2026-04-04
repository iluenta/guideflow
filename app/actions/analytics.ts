'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGuestChats(propertyId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[DEBUG] Auth User ID:', user?.id)
    if (!user) throw new Error('No autorizado')

    // Fetch tenant_id for the user
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    console.log('[DEBUG] Profile found:', profile, 'Error:', pError?.message)

    if (!profile?.tenant_id) throw new Error('No se encontró el perfil del usuario')

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
        .eq('tenant_id', profile.tenant_id)
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
