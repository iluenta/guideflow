"use client";

import React from 'react';
import { PhoneMockup } from './PhoneMockup';

export const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 overflow-hidden bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
          <div className="flex flex-col">
            <span className="flex items-center gap-2 font-jetbrains text-[11px] font-medium uppercase tracking-[0.15em] text-landing-ink/50 mb-6">
              <span className="w-2 h-2 rounded-full bg-landing-mint shadow-[0_0_10px_rgba(45,212,191,0.5)]"></span>
              Beta privada · primavera 2026
            </span>
            
            <h1 className="font-poppins font-bold text-5xl md:text-7xl text-landing-navy leading-[1.1] tracking-tight mb-8">
              Tu guía digital, gestionada por <em className="not-italic text-landing-mint drop-shadow-sm">IA</em> para tu tranquilidad.
            </h1>
            
            <p className="font-poppins text-lg md:text-xl text-landing-ink/70 leading-relaxed max-w-[600px] mb-10">
              Hospyia convierte cada apartamento turístico en una guía interactiva con IA: check-in, WiFi, manuales de electrodomésticos, recomendaciones locales y un asistente 24/7. Sin apps. Sin descargas. Sin más mensajes a las tres de la mañana.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="flex-1 max-w-[400px] relative">
                <input 
                  type="email" 
                  placeholder="tu@email.com" 
                  className="w-full h-14 pl-6 pr-4 bg-gray-50 border border-gray-200 rounded-2xl font-poppins text-landing-ink focus:outline-none focus:border-landing-mint transition-colors"
                />
              </div>
              <button 
                onClick={() => document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-14 px-8 bg-landing-navy text-white font-poppins font-semibold rounded-2xl hover:shadow-xl hover:shadow-landing-navy/20 transition-all active:scale-95 whitespace-nowrap"
              >
                Reservar plaza →
              </button>
            </div>
            
            <div className="flex flex-wrap gap-12">
              <div className="flex flex-col">
                <strong className="font-poppins text-2xl font-bold text-landing-navy">30 min</strong>
                <span className="font-jetbrains text-[10px] font-medium uppercase tracking-wider text-landing-ink/40">Configuración con IA</span>
              </div>
              <div className="flex flex-col">
                <strong className="font-poppins text-2xl font-bold text-landing-navy">24/7</strong>
                <span className="font-jetbrains text-[10px] font-medium uppercase tracking-wider text-landing-ink/40">Asistente multiidioma</span>
              </div>
              <div className="flex flex-col">
                <strong className="font-poppins text-2xl font-bold text-landing-navy">0 apps</strong>
                <span className="font-jetbrains text-[10px] font-medium uppercase tracking-wider text-landing-ink/40">Solo una URL</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
};
