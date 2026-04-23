"use client";

import React from 'react';
import { PhoneMockup } from './PhoneMockup';

export const HeroSection = () => {
  return (
    <section className="pt-24 pb-12 overflow-hidden bg-landing-bg">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.1fr] gap-12 lg:gap-24 items-center">
          <div>
            <span className="eyebrow mb-8">
              <span className="eyebrow-dot"></span>
              Beta privada · primavera 2026
            </span>
            
            <h1 className="font-poppins font-bold text-[clamp(44px,6vw,72px)] leading-[1.02] tracking-[-0.04em] text-landing-navy mb-8">
              Tu guía digital, gestionada por <em className="not-italic text-landing-mint">IA</em> para tu tranquilidad.
            </h1>
            
            <p className="font-poppins text-[20px] leading-[1.5] text-landing-ink/60 max-w-[540px] mb-12">
              Redefine la experiencia de tus huéspedes con una guía interactiva inteligente. Ahorra tiempo, mejora tus reseñas y ofrece un servicio premium 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
              <a href="#beta" className="w-full sm:w-auto bg-landing-navy text-white px-10 py-4 rounded-full font-poppins font-bold text-[16px] hover:bg-landing-navy-soft transition-all text-center shadow-lg shadow-landing-navy/20">
                Reservar plaza
              </a>
              <a href="#features" className="w-full sm:w-auto px-10 py-4 rounded-full font-poppins font-bold text-[16px] text-landing-navy border border-landing-rule hover:bg-white transition-all text-center">
                Ver funciones
              </a>
            </div>

            <div className="flex gap-10 pt-10 border-t border-landing-rule/50 font-jetbrains text-[11px] text-landing-ink/30 uppercase tracking-[0.15em]">
              <div className="flex flex-col gap-1">
                <strong className="font-poppins font-bold text-[28px] text-landing-navy leading-none tracking-tighter lowercase">30 min</strong>
                Configuración
              </div>
              <div className="flex flex-col gap-1">
                <strong className="font-poppins font-bold text-[28px] text-landing-navy leading-none tracking-tighter">24/7</strong>
                Asistente
              </div>
              <div className="flex flex-col gap-1">
                <strong className="font-poppins font-bold text-[28px] text-landing-navy leading-none tracking-tighter lowercase">0 apps</strong>
                Instalación
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center h-[720px] relative">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
};
