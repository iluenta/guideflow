"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export const FeatureGrid = () => {
  return (
    <section id="features" className="py-24 bg-landing-bg">
      <div className="wrap">
        {/* Section Header */}
        <div className="text-center max-w-[800px] mx-auto mb-20">
          <h2 className="font-poppins font-bold text-[clamp(36px,4.5vw,58px)] leading-[1.05] tracking-tight text-landing-navy">
            Todo lo que tu huésped <em className="not-italic text-landing-mint bg-gradient-to-r from-landing-mint to-landing-navy bg-clip-text text-transparent">necesita saber</em>, en una URL.
          </h2>
          <p className="font-poppins text-[19px] text-landing-ink/60 mt-6 leading-relaxed">
            Importa tus datos de Airbnb o Booking y generamos una experiencia premium para tus huéspedes en segundos. Sin apps, sin fricción.
          </p>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* HostBot - feat-big */}
          <div className="feat col-span-12 lg:col-span-7 min-h-[440px] flex flex-col group">
            <span className="font-jetbrains text-[11px] tracking-widest text-landing-ink/30 mb-4">AI ASSISTANT</span>
            <h3 className="font-poppins font-semibold text-[28px] text-landing-navy mb-4 leading-tight">
              Un asistente que <em className="not-italic border-b-2 border-landing-mint">conoce tu casa</em> mejor que tú.
            </h3>
            <p className="text-landing-ink/60 text-[16px] max-w-[420px] mb-8">
              Entrenado con tus manuales y recomendaciones. Responde al instante cualquier duda sobre el alojamiento.
            </p>
            
            <div className="mt-auto bg-landing-bg-deep border border-landing-rule rounded-2xl p-6 flex flex-col gap-4">
              <div className="bg-landing-navy text-white p-3.5 px-4 rounded-2xl rounded-br-sm self-end max-w-[85%] text-[13px] shadow-lg shadow-landing-navy/10">
                ¡Hola! He llegado pero no veo el cajetín de las llaves.
              </div>
              <div className="bg-white border border-landing-rule p-3.5 px-4 rounded-2xl rounded-bl-sm self-start max-w-[85%] text-[13px] shadow-sm">
                <strong className="text-landing-navy block mb-1">HostBot</strong>
                Está justo a la derecha del timbre negro, bajo la maceta de jazmín. ¿Quieres que te envíe una foto?
              </div>
              <div className="flex gap-1.5 pl-2">
                <span className="w-1.5 h-1.5 bg-landing-mint rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-landing-mint rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-landing-mint rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>

          {/* Themes - feat-mid */}
          <div className="feat col-span-12 lg:col-span-5 min-h-[440px] flex flex-col group">
            <span className="font-jetbrains text-[11px] tracking-widest text-landing-ink/30 mb-4">DESIGN SYSTEM</span>
            <h3 className="font-poppins font-semibold text-[28px] text-landing-navy mb-4 leading-tight">
              Cinco temas <em className="not-italic border-b-2 border-landing-mint">premium</em>, uno por propiedad.
            </h3>
            <p className="text-landing-ink/60 text-[16px] mb-8">
              Tu guía adaptada al estilo de tu alojamiento. Desde minimalismo nórdico hasta lujo urbano.
            </p>

            <div className="mt-auto grid grid-cols-5 gap-2.5">
              {[
                { name: 'Modern',  bg: '#f4f4f5', accent: '#3b82f6', border: '#e4e4e7', label: '#09090b', font: 'Inter, sans-serif' },
                { name: 'Urban',   bg: '#09090b', accent: '#00d4ff', border: '#27272a', label: '#fafafa',  font: 'Oswald, sans-serif' },
                { name: 'Coastal', bg: '#f0f9ff', accent: '#f97316', border: '#bae6fd', label: '#0c4a6e', font: 'Nunito, sans-serif' },
                { name: 'Warm',    bg: '#fdfaf6', accent: '#f59e0b', border: '#e7d9c5', label: '#292524', font: 'Playfair Display, serif' },
                { name: 'Luxury',  bg: '#fafaf9', accent: '#fbbf24', border: '#d6c99a', label: '#1c1917', font: 'Cormorant Garamond, serif' },
              ].map((t, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-lg p-2 flex flex-col justify-between transition-transform group-hover:-translate-y-2"
                  style={{ background: t.bg, border: `1px solid ${t.border}`, transitionDelay: `${i * 80}ms` }}
                >
                  {/* Barra de acento */}
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: t.accent }} />
                  {/* Tipografía + label */}
                  <div>
                    <div className="text-[13px] font-semibold leading-none mb-1" style={{ color: t.label, fontFamily: t.font }}>Aa</div>
                    <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: t.label, opacity: 0.45, fontFamily: 'JetBrains Mono, monospace' }}>
                      {t.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Manuals - feat-third */}
          <div className="feat col-span-12 lg:col-span-4 min-h-[360px]">
            <span className="font-jetbrains text-[11px] tracking-widest text-landing-ink/30 mb-4">VISION AI</span>
            <h4 className="font-poppins font-semibold text-[22px] text-landing-navy mb-3">Foto ... manual.</h4>
            <p className="text-landing-ink/60 text-sm mb-6 leading-relaxed">Sube una foto de tus electrodomésticos y generamos las instrucciones por ti.</p>
            <div className="flex items-center justify-between gap-2 px-4">
               <div className="w-24 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-400">FOTO</div>
               <div className="text-landing-mint text-xl">→</div>
               <div className="w-32 h-32 bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                 <div className="h-1.5 w-full bg-landing-navy/10 rounded"></div>
                 <div className="h-1.5 w-2/3 bg-landing-navy/10 rounded"></div>
                 <div className="h-1.5 w-full bg-landing-navy/10 rounded"></div>
               </div>
            </div>
          </div>

          {/* Languages - feat-third */}
          <div className="feat col-span-12 lg:col-span-4 min-h-[360px]">
            <span className="font-jetbrains text-[11px] tracking-widest text-landing-ink/30 mb-4">MULTILINGUAL</span>
            <h4 className="font-poppins font-semibold text-[22px] text-landing-navy mb-3">Habla el idioma <em className="not-italic text-landing-mint">de tu huésped</em>.</h4>
            <p className="text-landing-ink/60 text-sm mb-6 leading-relaxed">Traducción automática en tiempo real para eliminar cualquier barrera idiomática.</p>
            <div className="flex flex-wrap gap-2">
               {['English', 'Español', 'Français', 'Deutsch', 'Italiano', '日本語'].map(lang => (
                 <span key={lang} className={cn("px-3 py-1.5 rounded-full border border-landing-rule text-[11px] font-medium transition-all", lang === 'English' ? 'bg-landing-navy text-white border-landing-navy' : 'bg-white text-landing-ink/50')}>
                   {lang}
                 </span>
               ))}
            </div>
          </div>

          {/* Guest Links - feat-third */}
          <div className="feat col-span-12 lg:col-span-4 min-h-[360px]">
             <span className="font-jetbrains text-[11px] tracking-widest text-landing-ink/30 mb-4">UNIQUE LINKS</span>
             <h4 className="font-poppins font-semibold text-[22px] text-landing-navy mb-3">Links únicos <em className="not-italic text-landing-mint">por reserva</em>.</h4>
             <p className="text-landing-ink/60 text-sm mb-6 leading-relaxed">Seguridad total. El link solo funciona durante los días de la estancia del huésped.</p>
             <div className="bg-landing-bg-deep rounded-xl p-4 border border-landing-rule">
                <div className="font-jetbrains text-[11px] text-landing-navy/40 mb-2 truncate">hospyia.com/g/casa-reina-4921</div>
                <div className="h-2 w-full bg-landing-mint/20 rounded-full overflow-hidden">
                   <div className="h-full w-2/3 bg-landing-mint"></div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-bold text-landing-navy/40 uppercase">
                   <span>Check-in</span>
                   <span>Stay</span>
                   <span>Check-out</span>
                </div>
             </div>
          </div>

          {/* Bottom Large Feature - MISSING IN PREVIOUS IMPLEMENTATION */}
          <div className="feat col-span-12 min-h-[160px] flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-8">
            <div>
              <h4 className="font-poppins font-semibold text-[26px] text-landing-navy mb-2">
                30 minutos de tu tiempo. <em className="not-italic text-landing-mint bg-gradient-to-r from-landing-mint to-landing-navy bg-clip-text text-transparent">Cero</em> conocimiento técnico.
              </h4>
              <p className="text-landing-ink/60 text-[16px]">Lanzamos tu guía en minutos, no en días. Importamos todo por ti.</p>
            </div>
            <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
               <div className="w-10 h-10 bg-landing-navy rounded"></div>
               <div className="w-10 h-10 bg-landing-navy rounded-full"></div>
               <div className="w-10 h-10 bg-landing-navy rounded"></div>
               <div className="w-10 h-10 bg-landing-navy rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
