'use client'

import { Suspense, useEffect, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptInvitation, getInvitationByToken } from '@/app/actions/team'
import { Loader2, CheckCircle2, XCircle, LogIn } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

type PageState =
  | { status: 'loading' }
  | { status: 'invalid'; message: string }
  | { status: 'needs_login'; email: string; token: string }
  | { status: 'accepting' }
  | { status: 'success' }
  | { status: 'error'; message: string }

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid', message: 'No se encontró el token de invitación.' })
      return
    }

    async function init() {
      // Verificar si el token es válido antes de hacer nada
      const invitation = await getInvitationByToken(token)

      if (!invitation) {
        setState({ status: 'invalid', message: 'Invitación no válida o no encontrada.' })
        return
      }
      if (new Date(invitation.expires_at) < new Date()) {
        setState({ status: 'invalid', message: 'La invitación ha expirado. Solicita una nueva al administrador.' })
        return
      }
      if (invitation.accepted_at) {
        setState({ status: 'invalid', message: 'Esta invitación ya fue aceptada anteriormente.' })
        return
      }

      // Comprobar si hay sesión activa
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirigir a login pre-rellenado con el email de la invitación
        setState({ status: 'needs_login', email: invitation.email, token })
        return
      }

      // Hay sesión — intentar aceptar directamente
      setState({ status: 'accepting' })
      startTransition(async () => {
        const result = await acceptInvitation(token, user.id)
        if (result.error) {
          setState({ status: 'error', message: result.error })
        } else {
          setState({ status: 'success' })
          setTimeout(() => router.push('/dashboard'), 2000)
        }
      })
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function handleLoginRedirect(email: string, tok: string) {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const callbackUrl = `${siteUrl}/accept-invitation?token=${tok}`
    const loginUrl = `/auth/login?email=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(callbackUrl)}`
    router.push(loginUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1593D2] px-8 py-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Logo size={20} />
          </div>
          <span className="text-white font-bold text-lg">Hospyia</span>
        </div>

        <div className="px-8 py-8">
          {state.status === 'loading' || state.status === 'accepting' ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#1593D2]" />
              <p className="text-sm text-gray-500">
                {state.status === 'loading' ? 'Verificando invitación...' : 'Aceptando invitación...'}
              </p>
            </div>
          ) : state.status === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <div>
                <h2 className="font-bold text-landing-ink text-lg">¡Bienvenido al equipo!</h2>
                <p className="text-sm text-gray-500 mt-1">Redirigiendo al dashboard...</p>
              </div>
            </div>
          ) : state.status === 'invalid' ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="w-12 h-12 text-red-400" />
              <div>
                <h2 className="font-bold text-landing-ink text-lg">Invitación no válida</h2>
                <p className="text-sm text-gray-500 mt-1">{state.message}</p>
              </div>
              <Link
                href="/"
                className="text-sm text-[#1593D2] hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          ) : state.status === 'needs_login' ? (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h2 className="font-bold text-landing-ink text-lg">Accede para continuar</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Inicia sesión con <strong>{state.email}</strong> para aceptar la invitación.
                </p>
              </div>
              <button
                onClick={() => handleLoginRedirect(state.email, state.token)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1593D2] text-white font-bold text-sm hover:bg-[#1280b8] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión con magic link
              </button>
              <p className="text-center text-xs text-gray-400">
                ¿No tienes cuenta? El magic link la creará automáticamente.
              </p>
            </div>
          ) : (
            /* error */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="w-12 h-12 text-red-400" />
              <div>
                <h2 className="font-bold text-landing-ink text-lg">No se pudo aceptar</h2>
                <p className="text-sm text-gray-500 mt-1">{state.message}</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {state.message.includes('otro email') && (
                  <Link
                    href="/auth/login"
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center transition-colors"
                  >
                    Iniciar sesión con otra cuenta
                  </Link>
                )}
                <Link
                  href="/"
                  className="text-sm text-[#1593D2] hover:underline"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
