import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ profile: null, error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Error al obtener perfil - no exponer detalles sensibles
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting profile')
      }
      return NextResponse.json(
        { profile: null, error: 'Error al obtener perfil' },
        { status: profileError.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({ profile, error: null })
  } catch (error) {
    // Error interno - no exponer detalles
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in profile API route')
    }
    return NextResponse.json(
      { profile: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
