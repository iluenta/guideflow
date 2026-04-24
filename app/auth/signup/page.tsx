"use client"

import { Suspense } from 'react'
import Link from 'next/link'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Logo } from '@/components/ui/logo'

function SignupForm() {
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
          <span className="text-white text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            Hospyia
          </span>
        </div>

        {/* Claim central */}
        <div className="relative z-10 space-y-6">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#2dd4bf]">
            ● Beta privada · 100 plazas
          </p>
          <h1 className="text-white font-bold leading-[1.05]"
              style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: 'clamp(36px,4vw,52px)', letterSpacing: '-0.03em' }}>
            Únete a los<br />
            anfitriones <span className="text-[#2dd4bf]">fundadores.</span>
          </h1>
          <p className="text-white/70 text-[17px] leading-relaxed max-w-sm"
             style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            Acceso gratuito durante toda la beta, 50% de descuento de por vida al lanzar, y línea directa con el equipo.
          </p>

          {/* Perks */}
          <ul className="space-y-3 pt-2 border-t border-white/10">
            {[
              'Configuración personalizada de tu primera propiedad',
              'Acceso gratuito durante toda la beta',
              '50% de descuento de por vida al lanzar',
            ].map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <span className="text-[#2dd4bf] font-bold mt-0.5 flex-shrink-0">✓</span>
                <span className="text-white/80 text-[14px] leading-snug"
                      style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{perk}</span>
              </li>
            ))}
          </ul>
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
            Registro · Magic link
          </p>

          <h2 className="font-bold text-[#0f172a] mb-2 leading-tight"
              style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: '26px', letterSpacing: '-0.4px' }}>
            Crear cuenta
          </h2>
          <p className="text-[#475569] text-[15px] leading-relaxed mb-8"
             style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            Introduce tu correo y te enviamos un enlace para activar tu acceso. Sin contraseña.
          </p>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
            <MagicLinkForm mode="signup" />
          </div>

          <p className="text-center text-[14px] text-[#94a3b8] mt-6"
             style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login"
                  className="text-[#1e3a8a] font-semibold hover:underline underline-offset-2">
              Inicia sesión aquí
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a8a] border-r-transparent" />
          <p className="text-[#475569]">Cargando...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
