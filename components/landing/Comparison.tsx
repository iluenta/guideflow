"use client";

import React from 'react';

const BAD_LIST = [
  "¿Cómo se abre el portal?",
  "¿A qué hora era el check-out?",
  "No nos funciona el aire acondicionado",
  "¿Tenéis secador de pelo?",
  "No encuentro el cajetín de las llaves"
];

const GOOD_LIST = [
  "Guía de acceso paso a paso con vídeo",
  "Check-out automático y recordatorios",
  "Manuales interactivos de cada aparato",
  "Inventario detallado y fotos reales",
  "Localización GPS exacta del cajetín"
];

export const Comparison = () => {
  return (
    <section className="py-32 bg-landing-bg">
      <div className="wrap">
        <div className="text-center mb-20">
          <h2 className="font-poppins font-bold text-[clamp(32px,4vw,52px)] leading-[1.1] tracking-tight text-landing-navy">
            El <em className="not-italic text-landing-mint">antes</em> y el <em className="not-italic text-landing-mint">después</em><br />de un buen check-in.
          </h2>
        </div>

        <div className="compare grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bad Column */}
          <div className="compare-col bad p-10 bg-white border border-landing-rule rounded-[32px] shadow-sm">
            <div className="font-jetbrains text-[11px] tracking-[0.2em] uppercase text-landing-ink/30 mb-6">OTRO MENSAJE PREGUNTANDO EL WIFI</div>
            <ul className="space-y-5">
              {BAD_LIST.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-[16px] text-landing-ink/50 leading-relaxed italic">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-400 mt-[10px]"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Good Column */}
          <div className="compare-col good p-10 bg-white border border-landing-mint/30 rounded-[32px] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-[rgba(94,234,212,0.15)] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="font-jetbrains text-[11px] tracking-[0.2em] uppercase text-landing-mint-deep mb-6">TU HUÉSPED LLEGA Y <strong className="font-bold">YA SABE TODO</strong></div>
              <ul className="space-y-5">
                {GOOD_LIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-[16px] text-landing-navy leading-relaxed font-semibold">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-landing-mint mt-[10px]"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
