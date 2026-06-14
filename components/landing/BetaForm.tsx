"use client";

import React from 'react';

const BENEFITS = [
  "Configuración personalizada de tu primera propiedad",
  "Acceso gratuito durante toda la beta",
  "50% de descuento de por vida al lanzar",
  "Influencia directa sobre el roadmap"
];

export const BetaForm = () => {
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

            {/* Right column: coming soon notice */}
            <div className="bg-[#1a2e7a]/50 border border-white/5 backdrop-blur-md p-8 rounded-[24px] shadow-2xl">
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-landing-mint/20 border border-landing-mint/40 flex items-center justify-center mx-auto text-2xl">
                  🕐
                </div>
                <h3 className="font-poppins font-bold text-[22px] text-landing-mint">Próximamente...</h3>
                <p className="font-poppins text-[15px] opacity-70 leading-relaxed">
                  Estamos terminando de preparar la beta privada. Las inscripciones aún no están abiertas — vuelve pronto para reservar tu plaza.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
