"use client"

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Home } from 'lucide-react'

function LoginForm() {
  const router = useRouter()

  // Manejar tokens en hash si Supabase redirige directamente a login
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (!hash) return

    const hashParams = new URLSearchParams(hash)
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    // Si hay tokens en el hash, redirigir al callback para procesarlos
    if (accessToken && refreshToken) {
      // Construir URL de callback con los tokens en query params para que el callback los procese
      const callbackUrl = `/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`
      router.push(callbackUrl)
      return
    }
  }, [router])
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
            <MagicLinkForm mode="login" />
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
