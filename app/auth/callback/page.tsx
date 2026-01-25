"use client"

import { useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Evitar doble ejecución en React 18/19 Strict Mode
    if (hasProcessed.current) return

    async function handleCallback() {
      // Marcar como procesado al inicio para evitar re-intentos concurrentes
      hasProcessed.current = true
      // Leer parámetros del hash (fragmento de URL después de #) - PRIORITARIO
      // Usar window.location directamente para asegurar que leemos el hash actual
      const fullHash = window.location.hash
      const hash = fullHash ? fullHash.substring(1) : ''
      const hashParams = new URLSearchParams(hash)

      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashError = hashParams.get('error')
      const hashErrorDescription = hashParams.get('error_description')

      // También verificar query params (por si viene de otro flujo o redirección desde login)
      let effectiveParams = searchParams

      // En algunos casos searchParams puede estar vacío inicialmente en producción
      // o ser afectado por ruteos de middleware/proxies. Usamos la URL real como respaldo.
      if (!effectiveParams.has('code') && !effectiveParams.has('token_hash') && typeof window !== 'undefined') {
        effectiveParams = new URL(window.location.href).searchParams
      }

      const code = effectiveParams.get('code')
      const tokenHash = effectiveParams.get('token_hash')
      const type = effectiveParams.get('type')
      const queryError = effectiveParams.get('error')
      const queryAccessToken = effectiveParams.get('access_token') // Por si viene desde login
      const queryRefreshToken = effectiveParams.get('refresh_token') // Por si viene desde login

      // Log para debugging en producción (ayuda a diagnosticar problemas de parámetros)
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth Callback Params:', {
          hasHashTokens: !!(accessToken && refreshToken),
          hasCode: !!code,
          hasTokenHash: !!tokenHash,
          type
        })
      }

      // PRIORIDAD 1: Si hay tokens en el hash, procesarlos primero (ignorar errores en query params)
      // Caso 1: Tokens en hash (magic link/recovery directo de Supabase)
      // Necesitamos enviarlos al servidor para establecer cookies HTTP-only
      if (accessToken && refreshToken) {
        // Limpiar el hash de la URL para evitar loops
        window.history.replaceState(null, '', window.location.pathname + window.location.search)

        try {
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
            }),
            credentials: 'include',
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Callback API error (hash):', errorData.error)
            router.push(`/auth/login?error=${encodeURIComponent(errorData.error || 'Error al iniciar sesión')}`)
            return
          }

          // Redirigir al dashboard
          router.push('/dashboard')
          return
        } catch (err) {
          console.error('Error processing callback:', err)
          router.push(`/auth/login?error=${encodeURIComponent('Error inesperado')}`)
          return
        }
      }

      // También verificar tokens en query params (por si vienen desde login)
      if (queryAccessToken && queryRefreshToken) {
        try {
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: queryAccessToken,
              refresh_token: queryRefreshToken,
            }),
            credentials: 'include',
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Callback API error (query tokens):', errorData.error)
            router.push(`/auth/login?error=${encodeURIComponent(errorData.error || 'Error al iniciar sesión')}`)
            return
          }

          // Redirigir al dashboard
          router.push('/dashboard')
          return
        } catch (err) {
          console.error('Error processing callback from query params:', err)
          router.push(`/auth/login?error=${encodeURIComponent('Error inesperado')}`)
          return
        }
      }

      // Manejar errores SOLO si no hay tokens válidos
      if ((hashError || queryError) && !accessToken && !refreshToken && !queryAccessToken && !queryRefreshToken && !tokenHash && !code) {
        const errorMessage = hashErrorDescription || hashError || queryError || 'Error de autenticación'
        console.error('Auth error received:', errorMessage)
        router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
        return
      }

      // Caso 2: token_hash en query params (nuestro script)
      if (tokenHash && type) {
        try {
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token_hash: tokenHash,
              type: type,
            }),
            credentials: 'include',
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Callback API error (token_hash):', errorData.error)
            router.push(`/auth/login?error=${encodeURIComponent(errorData.error || 'Error al iniciar sesión')}`)
            return
          }

          // Redirigir al dashboard
          router.push('/dashboard')
          return
        } catch (err) {
          console.error('Error verifying token:', err)
          router.push(`/auth/login?error=${encodeURIComponent('Error al verificar el token')}`)
          return
        }
      }

      // Caso 3: code en query params (OAuth normal)
      if (code) {
        try {
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: code,
            }),
            credentials: 'include',
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Callback API error (code):', errorData.error)
            router.push(`/auth/login?error=${encodeURIComponent(errorData.error || 'Error al iniciar sesión')}`)
            return
          }

          // Redirigir al dashboard
          router.push('/dashboard')
          return
        } catch (err) {
          console.error('Error exchanging code:', err)
          router.push(`/auth/login?error=${encodeURIComponent('Error al procesar el código')}`)
          return
        }
      }

      // Si no hay ningún parámetro válido, redirigir a login con un mensaje más claro
      const debugInfo = `(Params: hash=${!!accessToken}, code=${!!code}, token=${!!tokenHash})`
      console.warn('No authentication parameters found.', debugInfo)
      router.push(`/auth/login?error=${encodeURIComponent('No se recibieron datos de autenticación válidos. Por favor, intenta de nuevo.')}`)
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground">Procesando autenticación...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
