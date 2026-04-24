"use client";

import React, { useTransition, useState } from 'react';
import { submitBetaSignup } from '@/app/actions/beta';

const BENEFITS = [
  "Configuración personalizada de tu primera propiedad",
  "Acceso gratuito durante toda la beta",
  "50% de descuento de por vida al lanzar",
  "Influencia directa sobre el roadmap"
];

export const BetaForm = () => {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount] = useState(67);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitBetaSignup(formData);
      if (result.success) {
        setStatus('success');
        setCount(c => Math.min(c + 1, 100));
      } else {
        setStatus('error');
        setErrorMsg(result.error ?? 'Ha ocurrido un error. Inténtalo de nuevo.');
      }
    });
  };

  return (
    <section id="beta" className="py-24 bg-landing-bg">
      <div className="wrap">
        <div className="beta-block relative bg-[#15296b] rounded-[40px] p-8 lg:p-16 overflow-hidden text-white shadow-2xl">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-landing-mint opacity-[0.15] blur-[80px] -translate-y-1/3 translate-x-1/3" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-20 items-center">

            {/* Left column */}
            <div>
              <div className="flex items-center gap-2 font-jetbrains text-[10px] tracking-[0.2em] uppercase text-landing-mint mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-landing-mint" />
                Acceso Anticipado
              </div>
              <h2 className="font-poppins font-bold text-[clamp(36px,5vw,56px)] leading-[1.05] mb-8 tracking-tight">
                Entra en la <span className="text-landing-mint">beta</span><br />privada. 100 plazas.
              </h2>
              <p className="font-poppins text-[17px] opacity-70 mb-10 leading-relaxed max-w-[460px]">
                Estamos abriendo Hospyia a 100 anfitriones fundadores. Sin coste durante la beta y con línea directa al equipo.
              </p>
              <ul className="space-y-4">
                {BENEFITS.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-[15px] font-medium opacity-90">
                    <span className="text-landing-mint">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right column: form card */}
            <div className="bg-[#1a2e7a]/50 border border-white/5 backdrop-blur-md p-8 rounded-[24px] shadow-2xl">

              {status === 'success' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-landing-mint/20 border border-landing-mint/40 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <h3 className="font-poppins font-bold text-[22px] text-landing-mint">¡Tu plaza está reservada!</h3>
                  <p className="font-poppins text-[15px] opacity-70 leading-relaxed">
                    Revisa tu correo. En las próximas 48 horas nos ponemos en contacto contigo para configurar tu primera propiedad.
                  </p>
                  <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                    <span className="text-[9px] font-jetbrains uppercase opacity-40 tracking-widest">Plazas</span>
                    <div className="flex-1 h-1.5 bg-[#0f1d4a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-landing-mint shadow-[0_0_10px_rgba(94,234,212,0.4)] transition-all duration-700"
                        style={{ width: `${count}%` }}
                      />
                    </div>
                    <span className="text-[14px] font-jetbrains font-bold text-white tracking-tighter">{count}/100</span>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-[9px] font-jetbrains uppercase opacity-50 tracking-[0.2em] ml-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="tu@email.com"
                      disabled={isPending}
                      className="w-full h-12 px-5 rounded-xl bg-[#0f1d4a] border border-white/5 outline-none font-poppins text-white placeholder:text-white/20 focus:border-landing-mint/30 transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-jetbrains uppercase opacity-50 tracking-[0.2em] ml-1">¿Cuántas propiedades gestionas?</label>
                    <select
                      name="properties"
                      disabled={isPending}
                      className="w-full h-12 px-4 rounded-xl bg-[#0f1d4a] border border-white/5 outline-none font-poppins text-white/40 focus:border-landing-mint/30 transition-all appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Selecciona...</option>
                      <option value="1-5">1-5</option>
                      <option value="6-20">6-20</option>
                      <option value="20+">20+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-jetbrains uppercase opacity-50 tracking-[0.2em] ml-1">Ciudad o Zona</label>
                    <input
                      name="city"
                      type="text"
                      placeholder="Málaga, Lisboa, Medellín..."
                      disabled={isPending}
                      className="w-full h-12 px-5 rounded-xl bg-[#0f1d4a] border border-white/5 outline-none font-poppins text-white placeholder:text-white/20 focus:border-landing-mint/30 transition-all disabled:opacity-50"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-[13px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 leading-snug">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-14 mt-2 rounded-full bg-landing-mint text-[#0f1d4a] font-poppins font-bold text-[16px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-landing-mint/20 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#0f1d4a]/30 border-t-[#0f1d4a] rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Quiero una plaza →'
                    )}
                  </button>

                  <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                    <span className="text-[9px] font-jetbrains uppercase opacity-40 tracking-widest">Plazas</span>
                    <div className="flex-1 h-1.5 bg-[#0f1d4a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-landing-mint shadow-[0_0_10px_rgba(94,234,212,0.4)]"
                        style={{ width: `${count}%` }}
                      />
                    </div>
                    <span className="text-[14px] font-jetbrains font-bold text-white tracking-tighter">{count}/100</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
