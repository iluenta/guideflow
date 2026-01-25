'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email')?.toString()
  if (!email) {
    redirect('/auth/login?error=' + encodeURIComponent('El email es requerido'))
    return // Never reached, but satisfies TypeScript
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    redirect('/auth/login?error=' + encodeURIComponent('Por favor, ingresa un email válido'))
    return
  }

  const supabase = await createClient()
  
  // Get the site URL from environment or construct it
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUrl = `${siteUrl}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    // Log solo el código de error (sin información sensible)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error sending magic link:', error.code || error.status)
    }
    
    let errorMessage = 'No se pudo enviar el enlace mágico'
    
    // Handle specific error codes
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@hostguide.app'
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      errorMessage = `Límite de envío de emails alcanzado. Esto puede durar hasta 1 hora. Soluciones: 1) Espera 30-60 minutos, 2) Usa otro email, 3) Configura SMTP externo en Supabase Dashboard > Settings > Auth > SMTP Settings. Si el problema persiste, contacta a ${supportEmail}`
    } else if (error.status === 500 && (error.code === 'unexpected_failure' || error.message.includes('Error sending confirmation email'))) {
      errorMessage = `Error al enviar el email de confirmación. Verifica la configuración de SMTP en Supabase Dashboard > Settings > Auth > SMTP Settings. Asegúrate de que: 1) El email del remitente esté verificado en Resend, 2) El API Key sea correcto, 3) El puerto sea 465 (SSL) o 587 (TLS). Si el problema persiste, contacta a ${supportEmail}`
    } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
      errorMessage = `Límite de envío de emails alcanzado. Espera 30-60 minutos o usa otro email. Si necesitas ayuda, contacta a ${supportEmail}`
    } else if (error.message.includes('invalid')) {
      errorMessage = 'Email inválido. Por favor, verifica tu dirección de correo.'
    } else {
      // Para otros errores, mostrar el mensaje de Supabase
      errorMessage = error.message || 'Error desconocido. Por favor, intenta de nuevo.'
    }
    
    redirect('/auth/login?error=' + encodeURIComponent(errorMessage))
    return
  }

  redirect('/auth/login?success=' + encodeURIComponent('Revisa tu correo. Te hemos enviado un enlace mágico.'))
}

export async function signUpWithMagicLink(formData: FormData) {
  const email = formData.get('email')?.toString()
  const fullName = formData.get('fullName')?.toString()

  if (!email) {
    redirect('/auth/signup?error=' + encodeURIComponent('El email es requerido'))
    return
  }

  if (!fullName || fullName.trim().length === 0) {
    redirect('/auth/signup?error=' + encodeURIComponent('El nombre completo es requerido'))
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    redirect('/auth/signup?error=' + encodeURIComponent('Por favor, ingresa un email válido'))
    return
  }

  const supabase = await createClient()

  // Generate a secure random password that will never be used
  // User will only authenticate via magic link
  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Get the site URL from environment or construct it
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUrl = `${siteUrl}/auth/callback`

  const { error } = await supabase.auth.signUp({
    email,
    password: tempPassword, // Temporary password, never used - user only uses magic link
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName.trim(),
        role: 'user', // Default all users are end users
        package_level: 'basic', // Basic level by default
      },
    },
  })

  if (error) {
    // Log solo el código de error (sin información sensible)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error signing up:', error.code || error.status)
    }
    
    let errorMessage = 'No se pudo crear la cuenta'
    
    // Handle specific error codes
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@hostguide.app'
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      errorMessage = `Límite de envío de emails alcanzado. Esto puede durar hasta 1 hora. Soluciones: 1) Espera 30-60 minutos, 2) Usa otro email, 3) Configura SMTP externo en Supabase Dashboard > Settings > Auth > SMTP Settings. Si el problema persiste, contacta a ${supportEmail}`
    } else if (error.status === 500 && (error.code === 'unexpected_failure' || error.message.includes('Error sending confirmation email'))) {
      errorMessage = `Error al enviar el email de confirmación. Verifica la configuración de SMTP en Supabase Dashboard > Settings > Auth > SMTP Settings. Asegúrate de que: 1) El email del remitente esté verificado en Resend, 2) El API Key sea correcto, 3) El puerto sea 465 (SSL) o 587 (TLS). Si el problema persiste, contacta a ${supportEmail}`
    } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
      errorMessage = 'Este email ya está registrado. Por favor, inicia sesión en su lugar.'
    } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
      errorMessage = `Límite de envío de emails alcanzado. Espera 30-60 minutos o usa otro email. Si necesitas ayuda, contacta a ${supportEmail}`
    } else if (error.message.includes('invalid')) {
      errorMessage = 'Email inválido. Por favor, verifica tu dirección de correo.'
    } else {
      // Para otros errores, mostrar el mensaje de Supabase
      errorMessage = error.message || 'Error desconocido. Por favor, intenta de nuevo.'
    }
    
    redirect('/auth/signup?error=' + encodeURIComponent(errorMessage))
    return
  }

  redirect('/auth/signup?success=' + encodeURIComponent('Revisa tu correo para completar el registro.'))
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    // Error al cerrar sesión - no exponer detalles
    if (process.env.NODE_ENV === 'development') {
      console.error('Error signing out')
    }
    redirect('/dashboard?error=Could not sign out')
  }

  redirect('/auth/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    // Error al obtener sesión - no exponer detalles
    return null
  }

  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    // Error al obtener usuario - no exponer detalles
    return null
  }

  return user
}
