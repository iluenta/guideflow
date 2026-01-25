import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { access_token, refresh_token, token_hash, type, code } = body

    const supabase = await createClient()

    // Caso 1: Tokens directos (del hash)
    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (error) {
        // Log del error para debugging (sin exponer tokens)
        if (process.env.NODE_ENV === 'development') {
          console.error('Error setting session:', error.message, error.status)
        }
        return NextResponse.json(
          { error: error.message || 'Error al establecer la sesión' },
          { status: 400 }
        )
      }

      // Verificar que la sesión se estableció correctamente
      if (!data.session) {
        return NextResponse.json(
          { error: 'No se pudo establecer la sesión' },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Caso 2: token_hash (de nuestro script)
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'email' | 'recovery' | 'magiclink',
      })

      if (error) {
        let errorMessage = 'Error al verificar el token'
        
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          errorMessage = 'El enlace ha expirado o es inválido'
        } else if (error.message.includes('already been used')) {
          errorMessage = 'Este enlace ya ha sido utilizado'
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Caso 3: code (OAuth normal)
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        let errorMessage = 'Error al intercambiar el código'
        
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          errorMessage = 'El código ha expirado o es inválido'
        } else if (error.message.includes('already been used')) {
          errorMessage = 'Este código ya ha sido utilizado'
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Parámetros de autenticación inválidos' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en callback API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
