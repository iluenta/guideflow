"use client";

import React from 'react';

const STEPS = [
  {
    num: "I",
    title: "Guarda tu casa",
    desc: "Importa tu anuncio de Airbnb o Booking en segundos. Nosotros extraemos los datos clave."
  },
  {
    num: "II",
    title: "Sube fotos",
    desc: "Haz fotos a tus electrodomésticos y zonas comunes. Nuestra IA genera los manuales por ti."
  },
  {
    num: "III",
    title: "Comparte el link",
    desc: "Envía el enlace mágico a tus huéspedes y olvida las dudas repetitivas para siempre."
  }
];

export const HowItWorks = () => {
  return (
    <section id="how" className="py-32 bg-white overflow-hidden">
      <div className="wrap">
        <div className="text-center mb-24">
          <h2 className="font-poppins font-bold text-[clamp(32px,4.5vw,58px)] leading-[1.05] tracking-tight text-landing-navy">
            De cero a guía publicada en <em className="not-italic text-landing-mint border-b-4 border-landing-mint/30">tres pasos</em>.
          </h2>
        </div>

        <div className="steps grid md:grid-cols-3 gap-16 relative">
          {/* Dashed Connector Line */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] border-t border-dashed border-landing-rule z-0"></div>

          {STEPS.map((step, i) => (
            <div key={i} className="step relative z-10 text-center flex flex-col items-center">
              <div className="step-num w-20 h-20 rounded-full bg-white border-2 border-landing-navy text-landing-navy flex items-center justify-center font-poppins font-bold text-[28px] mb-8 shadow-sm">
                {step.num}
              </div>
              <h3 className="font-poppins font-bold text-[22px] text-landing-navy mb-4 tracking-tight">
                {step.title}
              </h3>
              <p className="text-landing-ink/60 text-[16px] max-w-[300px] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
