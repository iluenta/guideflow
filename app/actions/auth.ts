'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email')?.toString()
  const next = formData.get('next')?.toString() || ''
  
  if (!email) {
    const errorUrl = `/auth/login?error=${encodeURIComponent('El email es requerido')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    const errorUrl = `/auth/login?error=${encodeURIComponent('Por favor, ingresa un email válido')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  const supabase = await createClient()
  
  // Get the site URL from headers (origin) for better accuracy in different environments
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('host')
  const protocol = origin?.includes('localhost') ? 'http' : 'https'
  const siteUrl = origin 
    ? (origin.startsWith('http') ? origin : `${protocol}://${origin}`) 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
    
  let redirectUrl = `${siteUrl}/auth/callback`
  if (next) {
    redirectUrl += `?next=${encodeURIComponent(next)}`
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    // Log details for debugging
    console.error('Error sending magic link details:', {
      code: error.code,
      status: error.status,
      message: error.message,
      redirectUrl
    })
    
    let errorMessage = 'No se pudo enviar el enlace mágico'
    if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.message.includes('rate limit') || error.message.includes('too many')) {
      errorMessage = `Demasiados intentos. Espera unos minutos y vuelve a intentarlo.`
    } else if (error.message.includes('invalid')) {
      errorMessage = 'Email inválido. Por favor, verifica tu dirección de correo.'
    } else {
      errorMessage = 'No se pudo enviar el enlace. Por favor, inténtalo de nuevo.'
    }

    const errorUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  const successUrl = `/auth/login?success=${encodeURIComponent('Revisa tu correo. Te hemos enviado un enlace mágico.')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
  redirect(successUrl)
}

export async function signUpWithMagicLink(formData: FormData) {
  const email = formData.get('email')?.toString()
  const fullName = formData.get('fullName')?.toString()
  const next = formData.get('next')?.toString() || ''

  if (!email) {
    const errorUrl = `/auth/signup?error=${encodeURIComponent('El email es requerido')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  if (!fullName || fullName.trim().length === 0) {
    const errorUrl = `/auth/signup?error=${encodeURIComponent('El nombre completo es requerido')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    const errorUrl = `/auth/signup?error=${encodeURIComponent('Por favor, ingresa un email válido')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  const supabase = await createClient()

  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Get the site URL from headers (origin) for better accuracy
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('host')
  const protocol = origin?.includes('localhost') ? 'http' : 'https'
  const siteUrl = origin 
    ? (origin.startsWith('http') ? origin : `${protocol}://${origin}`) 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
    
  let redirectUrl = `${siteUrl}/auth/callback`
  if (next) {
    redirectUrl += `?next=${encodeURIComponent(next)}`
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName.trim(),
        role: 'user',
      },
    },
  })

  if (error) {
    // Log details for debugging
    console.error('Error signing up details:', {
      code: error.code,
      status: error.status,
      message: error.message,
      redirectUrl
    })
    
    let errorMessage = 'No se pudo crear la cuenta'
    if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.message.includes('rate limit') || error.message.includes('too many')) {
      errorMessage = 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
    } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
      errorMessage = 'No se pudo completar el registro. Por favor, inténtalo de nuevo.'
    } else if (error.message.includes('invalid')) {
      errorMessage = 'Email inválido. Por favor, verifica tu dirección de correo.'
    } else {
      errorMessage = 'No se pudo crear la cuenta. Por favor, inténtalo de nuevo.'
    }

    const errorUrl = `/auth/signup?error=${encodeURIComponent(errorMessage)}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
    return
  }

  const successUrl = `/auth/signup?success=${encodeURIComponent('Revisa tu correo para completar el registro.')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
  redirect(successUrl)
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
