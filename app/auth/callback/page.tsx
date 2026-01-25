"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleCallback() {
      // Leer parámetros del hash (fragmento de URL después de #) - PRIORITARIO
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashError = hashParams.get('error')
      const hashErrorDescription = hashParams.get('error_description')
      
      // También verificar query params (por si viene de otro flujo)
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const queryError = searchParams.get('error')

      // PRIORIDAD 1: Si hay tokens en el hash, procesarlos primero (ignorar errores en query params)
      // Caso 1: Tokens en hash (magic link/recovery directo de Supabase)
      // Necesitamos enviarlos al servidor para establecer cookies HTTP-only
      if (accessToken && refreshToken) {
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

      // Manejar errores SOLO si no hay tokens válidos
      if ((hashError || queryError) && !accessToken && !refreshToken && !tokenHash && !code) {
        const errorMessage = hashErrorDescription || hashError || queryError || 'Error de autenticación'
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

      // Si no hay ningún parámetro válido, redirigir a login
      router.push('/auth/login?error=No se recibió código de autenticación')
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
