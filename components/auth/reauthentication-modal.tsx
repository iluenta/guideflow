"use client"

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendReauthCode, verifyReauthCode } from '@/app/actions/reauthentication'
import { Loader2, Mail, Shield } from 'lucide-react'
import { getSensitiveActionLabel } from '@/lib/constants/sensitive-actions'
import type { SensitiveAction } from '@/lib/constants/sensitive-actions'

interface ReauthenticationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: SensitiveAction
  onSuccess: (token: string) => void | Promise<void>
  userEmail: string
}

export function ReauthenticationModal({
  open,
  onOpenChange,
  action,
  onSuccess,
  userEmail,
}: ReauthenticationModalProps) {
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRequestCode = () => {
    setError(null)
    setSuccess(false)
    
    startTransition(async () => {
      const result = await sendReauthCode(userEmail)
      
      if (result.success) {
        setStep('verify')
        setSuccess(true)
      } else {
        setError(result.error || 'No se pudo enviar el código')
      }
    })
  }

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos')
      return
    }

    setError(null)
    
    startTransition(async () => {
      const result = await verifyReauthCode(userEmail, code)
      
      if (result.success && result.token) {
        await onSuccess(result.token)
        onOpenChange(false)
        // Reset state
        setCode('')
        setStep('request')
        setError(null)
        setSuccess(false)
      } else {
        setError(result.error || 'Código inválido')
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false)
      // Reset state when closing
      setTimeout(() => {
        setCode('')
        setStep('request')
        setError(null)
        setSuccess(false)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Re-autenticación requerida</DialogTitle>
          <DialogDescription>
            Para {getSensitiveActionLabel(action)}, necesitamos verificar tu identidad.
          </DialogDescription>
        </DialogHeader>

        {step === 'request' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Se enviará un código de 6 dígitos a <strong>{userEmail}</strong>
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={handleRequestCode}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar código
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            {success && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
                Código enviado. Revisa tu correo.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                  setError(null)
                }}
                disabled={isPending}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el código de 6 dígitos que recibiste por correo
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('request')
                  setCode('')
                  setError(null)
                }}
                disabled={isPending}
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={isPending || code.length !== 6}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
