import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ user: null, error: error.message }, { status: 401 })
    }

    return NextResponse.json({ user, error: null })
  } catch (error) {
    // Error interno - no exponer detalles
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting user session')
    }
    return NextResponse.json(
      { user: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
