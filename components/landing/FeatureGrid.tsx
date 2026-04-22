"use client";

import React from 'react';

const features = [
  {
    title: "IA que entiende tus manuales",
    description: "Sube una foto de tu cafetera o lavadora. Nuestra IA genera un manual visual y responde dudas a tus huéspedes.",
    icon: "📖"
  },
  {
    title: "Asistente Local 24/7",
    description: "Tus recomendaciones favoritas entrenadas en un chat que habla todos los idiomas. No más preguntas repetitivas.",
    icon: "💬"
  },
  {
    title: "Check-in sin fricción",
    description: "Toda la información de acceso, WiFi y normas de la casa en un solo link. Sin descargar apps.",
    icon: "🔑"
  },
  {
    title: "Aumenta tus reseñas",
    description: "Una experiencia premium que se traduce en mejores puntuaciones y huéspedes más felices.",
    icon: "⭐"
  }
];

export const FeatureGrid = () => {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl text-landing-navy mb-4">Todo lo que tu huésped necesita</h2>
          <p className="font-poppins text-landing-ink/60 max-w-[600px] mx-auto">Diseñado para que tú descanses mientras nosotros nos ocupamos de los detalles.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-xl hover:shadow-landing-navy/5 transition-all group">
              <div className="text-3xl mb-6 grayscale group-hover:grayscale-0 transition-all">{feature.icon}</div>
              <h3 className="font-poppins font-bold text-xl text-landing-navy mb-3">{feature.title}</h3>
              <p className="font-poppins text-landing-ink/70 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
