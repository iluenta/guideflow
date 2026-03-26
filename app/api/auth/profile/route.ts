import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('[API-AUTH] Unauthorized access attempt or getUser error:', userError?.message)
      }
      return NextResponse.json({ profile: null, error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[API-AUTH] Authenticated user:', user.email)
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[API-AUTH] Error getting profile:', profileError.message)
      }
      return NextResponse.json(
        { profile: null, error: 'Error al obtener perfil' },
        { status: profileError.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({ profile, error: null })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('[API-AUTH] Fatal error in profile API route:', error)
    }
    return NextResponse.json(
      { profile: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
