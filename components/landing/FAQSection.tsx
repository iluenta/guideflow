"use client";

import React, { useState } from 'react';

const faqs = [
  {
    question: "¿Cómo funciona la IA con mis manuales?",
    answer: "Simplemente subes una foto o PDF de cualquier electrodoméstico. Nuestra IA analiza el contenido visual y textual para crear una guía simplificada que tus huéspedes pueden consultar y preguntar sobre ella."
  },
  {
    question: "¿Mis huéspedes tienen que descargar una App?",
    answer: "No. Hospyia funciona como una aplicación web progresiva. Solo tienen que escanear un código QR o abrir un link que les envíes por WhatsApp, Booking o Airbnb."
  },
  {
    question: "¿En qué idiomas está disponible el asistente?",
    answer: "El asistente de IA detecta automáticamente el idioma del huésped y responde en más de 50 idiomas, manteniendo siempre el tono hospitalario de tu marca."
  },
  {
    question: "¿Es difícil de configurar?",
    answer: "Para nada. Puedes tener tu primera guía lista en menos de 10 minutos. Nuestra IA te ayuda a importar tus recomendaciones locales y normas de la casa automáticamente."
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-[800px] mx-auto px-6">
        <h2 className="font-poppins font-bold text-4xl text-landing-navy text-center mb-16">Preguntas frecuentes</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-100 rounded-3xl overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-poppins font-bold text-landing-navy">{faq.question}</span>
                <span className={`text-2xl transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}>+</span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-40' : 'max-h-0'}`}>
                <div className="p-6 pt-0 font-poppins text-landing-ink/70 leading-relaxed border-t border-gray-50">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
