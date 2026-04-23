"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: "¿Necesitan mis huéspedes descargar alguna app?",
    a: "No. Hospyia funciona directamente en el navegador del móvil a través de un enlace único o un código QR que puedes dejar en tu propiedad."
  },
  {
    q: "¿Cómo aprende la IA sobre mi alojamiento?",
    a: "Simplemente sube tus manuales en PDF, fotos de los electrodomésticos o pega tus instrucciones actuales. Nuestra IA procesa toda la información para responder con precisión."
  },
  {
    q: "¿Qué pasa si ya tengo un manual en papel?",
    a: "Perfecto. Solo tienes que hacerle fotos a las páginas. Nuestra IA de visión las leerá y convertirá en una guía interactiva estructurada automáticamente."
  },
  {
    q: "¿En qué idiomas está disponible?",
    a: "El asistente puede responder en más de 50 idiomas, detectando automáticamente el idioma del huésped para que siempre se sienta como en casa."
  },
  {
    q: "¿Es compatible con Airbnb y Booking?",
    a: "Sí, puedes importar los detalles básicos de tu propiedad directamente y usar Hospyia como complemento perfecto a estas plataformas."
  },
  {
    q: "¿Cuánto cuesta la suscripción?",
    a: "Estamos en fase beta privada con acceso gratuito. Los usuarios que se unan ahora disfrutarán de un descuento vitalicio del 50% cuando lancemos la versión final."
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-landing-bg">
      <div className="wrap border-t border-landing-rule/30 pt-24">
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-poppins font-bold text-[42px] text-landing-navy leading-tight tracking-tight">
              Preguntas frecuentes.
            </h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-landing-rule/50 pb-6 pt-6">
                <button 
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className={cn("font-poppins font-semibold text-[19px] transition-colors", openIndex === i ? "text-landing-navy" : "text-landing-ink/60 group-hover:text-landing-navy")}>
                    {faq.q}
                  </h3>
                  <span className={cn("text-2xl transition-transform duration-300", openIndex === i ? "rotate-45 text-landing-mint" : "text-landing-ink/20")}>+</span>
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", openIndex === i ? "max-h-[300px] mt-6" : "max-h-0")}>
                  <p className="font-poppins text-[17px] text-landing-ink/50 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
