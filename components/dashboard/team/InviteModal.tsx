'use client'

import { useState, useTransition } from 'react'
import { X, Send, AlertCircle, Copy, Check } from 'lucide-react'
import { inviteMember } from '@/app/actions/team'

interface InviteModalProps {
  onClose: () => void
  onSuccess: () => void
}

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Gestiona propiedades, reservas y configuración. No puede invitar miembros.',
  },
  {
    value: 'support',
    label: 'Soporte',
    description: 'Gestiona comunicación con huéspedes y reservas. Sin acceso a finanzas.',
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    description: 'Solo lectura: propiedades, reservas e informes.',
  },
] as const

export function InviteModal({ onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'support' | 'viewer'>('support')
  const [error, setError] = useState<string | null>(null)
  const [fallbackLink, setFallbackLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFallbackLink(null)

    if (!email.trim()) {
      setError('El email es requerido')
      return
    }

    startTransition(async () => {
      const result = await inviteMember(email.trim(), role)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.emailFailed && result.link) {
        setFallbackLink(result.link)
        return
      }
      onSuccess()
      onClose()
    })
  }

  async function copyLink() {
    if (!fallbackLink) return
    await navigator.clipboard.writeText(fallbackLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-landing-ink">Invitar miembro</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {fallbackLink ? (
          /* Estado: email falló, mostrar link manual */
          <div className="p-6 flex flex-col gap-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Invitación creada correctamente, pero el email no pudo enviarse. Copia el link y
                envíaselo manualmente.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <p className="text-xs text-gray-600 break-all flex-1">{fallbackLink}</p>
              <button
                onClick={copyLink}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-landing-navy text-white text-xs font-medium transition-colors hover:bg-landing-navy/90"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* Formulario normal */
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-landing-navy/20 focus:border-landing-navy"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Rol
              </label>
              <div className="flex flex-col gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      role === option.value
                        ? 'border-landing-navy bg-landing-navy/[0.04]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                      className="mt-0.5 accent-landing-navy"
                    />
                    <div>
                      <p className="text-sm font-semibold text-landing-ink">{option.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-landing-navy text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-landing-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {isPending ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
