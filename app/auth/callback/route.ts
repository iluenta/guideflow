import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors from Supabase
  if (errorParam) {
    let errorMessage = 'Error de autenticación'
    
    if (errorParam === 'access_denied') {
      if (errorDescription?.includes('expired')) {
        errorMessage = 'El enlace ha expirado. Por favor, solicita un nuevo enlace.'
      } else {
        errorMessage = 'Acceso denegado. Por favor, intenta de nuevo.'
      }
    } else if (errorParam === 'invalid_request') {
      errorMessage = 'Solicitud inválida. Por favor, intenta de nuevo.'
    }
    
    return redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      // Error al intercambiar código - no exponer detalles sensibles
      if (process.env.NODE_ENV === 'development') {
        console.error('Error exchanging code for session')
      }
      let errorMessage = 'Error al iniciar sesión'
      
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        errorMessage = 'El enlace ha expirado o es inválido. Por favor, solicita un nuevo enlace.'
      } else if (error.message.includes('already been used')) {
        errorMessage = 'Este enlace ya ha sido utilizado. Por favor, solicita un nuevo enlace.'
      }
      
      return redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
    }

    // Redirect to dashboard after successful authentication
    // Cookies are automatically set by the server client
    return redirect('/dashboard')
  }

  // If there's no code, redirect to login
  return redirect('/auth/login?error=No se recibió código de autenticación')
}
