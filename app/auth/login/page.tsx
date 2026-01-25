"use client"

import React, { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Home } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const [processingHash, setProcessingHash] = React.useState(false)

  // Manejar tokens en hash si Supabase redirige directamente a login
  // IMPORTANTE: Ejecutar inmediatamente, antes de renderizar
  useEffect(() => {
    // Usar window.location directamente para asegurar que leemos el hash actual
    const fullHash = window.location.hash
    if (!fullHash || fullHash.length <= 1) return

    const hash = fullHash.substring(1)
    const hashParams = new URLSearchParams(hash)
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    // Si hay tokens en el hash, procesarlos inmediatamente
    if (accessToken && refreshToken) {
      setProcessingHash(true)
      
      // Limpiar el hash y query params de la URL para evitar loops
      window.history.replaceState(null, '', window.location.pathname)
      
      // Enviar tokens directamente al servidor
      fetch('/api/auth/callback', {
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
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            setProcessingHash(false)
            router.push(`/auth/login?error=${encodeURIComponent(errorData.error || 'Error al iniciar sesión')}`)
            return
          }
          // Redirigir al dashboard
          router.push('/dashboard')
        })
        .catch((err) => {
          console.error('Error processing callback:', err)
          setProcessingHash(false)
          router.push(`/auth/login?error=${encodeURIComponent('Error inesperado al procesar autenticación')}`)
        })
    }
  }, [router])

  // Mostrar loading mientras procesamos el hash
  if (processingHash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Procesando autenticación...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold">HostGuide</span>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico para recibir un enlace mágico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MagicLinkForm mode="login" hideError={processingHash} />
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">¿No tienes una cuenta? </span>
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Regístrate aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold">HostGuide</span>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">Cargando...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
