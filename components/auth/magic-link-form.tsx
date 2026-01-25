"use client"

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithMagicLink, signUpWithMagicLink } from '@/app/actions/auth'
import { Mail, Loader2 } from 'lucide-react'

interface MagicLinkFormProps {
  mode: 'login' | 'signup'
  onSuccess?: () => void
}

function MagicLinkFormContent({ mode, onSuccess }: MagicLinkFormProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const success = searchParams.get('success')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (mode === 'signup' && !fullName.trim()) {
      return
    }

    const formData = new FormData(e.currentTarget)
    const submittedEmail = formData.get('email')?.toString() || email
    
    // Store email for success message
    if (submittedEmail) {
      setEmail(submittedEmail)
    }
    
    startTransition(async () => {
      if (mode === 'signup') {
        await signUpWithMagicLink(formData)
      } else {
        await signInWithMagicLink(formData)
      }
      onSuccess?.()
    })
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Revisa tu correo</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Hemos enviado un enlace mágico a <strong>{email || 'tu correo'}</strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Haz clic en el enlace del correo para {mode === 'signup' ? 'completar tu registro' : 'iniciar sesión'}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Juan García"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            {mode === 'signup' ? 'Crear cuenta con magic link' : 'Enviar magic link'}
          </>
        )}
      </Button>
    </form>
  )
}

export function MagicLinkForm({ mode, onSuccess }: MagicLinkFormProps) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            disabled
          />
        </div>
        <Button type="submit" className="w-full" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando...
        </Button>
      </div>
    }>
      <MagicLinkFormContent mode={mode} onSuccess={onSuccess} />
    </Suspense>
  )
}
