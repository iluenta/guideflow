"use client"

import React, { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Logo } from '@/components/ui/logo'

function LoginForm() {
  const router = useRouter()
  const [processingHash, setProcessingHash] = React.useState(false)

  useEffect(() => {
    const fullHash = window.location.hash
    if (!fullHash || fullHash.length <= 1) return

    const hash = fullHash.substring(1)
    const hashParams = new URLSearchParams(hash)
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      setProcessingHash(true)
      window.history.replaceState(null, '', window.location.pathname)

      fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        credentials: 'include',
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            setProcessingHash(false)
            router.push(`/auth/login?error=${encodeURIComponent(errorData.error || 'Error al iniciar sesión')}`)
            return
          }
          router.push('/dashboard')
        })
        .catch((err) => {
          console.error('Error processing callback:', err)
          setProcessingHash(false)
          router.push(`/auth/login?error=${encodeURIComponent('Error inesperado al procesar autenticación')}`)
        })
    }
  }, [router])

  if (processingHash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a8a] border-r-transparent" />
          <p className="text-[#475569] font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">Procesando autenticación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fafbfc]">

      {/* ── Columna izquierda — navy brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#1e3a8a] p-12 relative overflow-hidden">

        {/* Glow decorativo */}
        <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.25), transparent 70%)' }} />
        <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.12), transparent 70%)' }} />

        {/* Logo + wordmark */}
        <div className="flex items-center gap-3 relative z-10">
          <Logo size={32} variant="dark" />
          <span className="text-white text-xl font-bold tracking-tight" style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            Hospyia
          </span>
        </div>

        {/* Claim central */}
        <div className="relative z-10 space-y-6">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#2dd4bf]">
            ● Plataforma de gestión
          </p>
          <h1 className="text-white font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: 'clamp(36px,4vw,52px)', letterSpacing: '-0.03em' }}>
            Tu guía digital,<br />
            gestionada por <span className="text-[#2dd4bf]">IA.</span>
          </h1>
          <p className="text-white/70 text-[17px] leading-relaxed max-w-sm"
             style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            Convierte cada apartamento en una experiencia premium para tus huéspedes. Sin apps. Sin descargas.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-2 border-t border-white/10">
            {[
              { value: '30 min', label: 'Configuración con IA' },
              { value: '24/7', label: 'Asistente multiidioma' },
              { value: '0 apps', label: 'Solo una URL' },
            ].map(({ value, label }) => (
              <div key={value}>
                <div className="text-white font-bold text-2xl tracking-tight"
                     style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{value}</div>
                <div className="text-white/50 font-mono text-[10px] tracking-wider uppercase mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer lateral */}
        <p className="relative z-10 font-mono text-[10px] tracking-widest uppercase text-white/30">
          © 2026 Hospyia · Beta privada
        </p>
      </div>

      {/* ── Columna derecha — formulario ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 lg:p-16">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <Logo size={28} />
          <span className="text-[#1e3a8a] text-lg font-bold tracking-tight"
                style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>Hospyia</span>
        </div>

        <div className="w-full max-w-[400px]">

          {/* Eyebrow */}
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#94a3b8] mb-5">
            Acceso seguro · Magic link
          </p>

          <h2 className="font-bold text-[#0f172a] mb-2 leading-tight"
              style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: '26px', letterSpacing: '-0.4px' }}>
            Iniciar sesión
          </h2>
          <p className="text-[#475569] text-[15px] leading-relaxed mb-8"
             style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            Introduce tu correo y te enviamos un enlace mágico. Sin contraseña.
          </p>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
            <MagicLinkForm mode="login" hideError={processingHash} />
          </div>

          <p className="text-center text-[14px] text-[#94a3b8] mt-6"
             style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            ¿No tienes cuenta?{' '}
            <Link href="/auth/signup"
                  className="text-[#1e3a8a] font-semibold hover:underline underline-offset-2">
              Regístrate aquí
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a8a] border-r-transparent" />
          <p className="text-[#475569]">Cargando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
