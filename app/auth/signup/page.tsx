"use client"

import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Logo } from '@/components/ui/logo'

function SignupForm() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <Logo size={56} className="rounded-2xl shadow-md" />
          <span className="text-3xl font-black text-slate-900 tracking-tight">GuideFlow</span>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Crear cuenta</CardTitle>
            <CardDescription>
              Regístrate con tu correo electrónico para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MagicLinkForm mode="signup" />
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <Logo size={56} className="rounded-2xl shadow-md" />
            <span className="text-3xl font-black text-foreground tracking-tight">GuideFlow</span>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">Cargando...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
