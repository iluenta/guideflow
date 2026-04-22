"use client";

import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { FAQSection } from '@/components/landing/FAQSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { BetaForm } from '@/components/landing/BetaForm';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      
      {/* Social Proof / Trusted by (Small section) */}
      <div className="py-12 border-y border-gray-50 flex flex-col items-center">
        <p className="font-jetbrains text-[10px] font-medium uppercase tracking-widest text-landing-ink/30 mb-6">
          Confiado por propietarios de
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale">
          <span className="font-poppins font-bold text-xl">Airbnb</span>
          <span className="font-poppins font-bold text-xl">Booking.com</span>
          <span className="font-poppins font-bold text-xl">Expedia</span>
          <span className="font-poppins font-bold text-xl">VRBO</span>
        </div>
      </div>

      <FeatureGrid />
      
      {/* Mini CTA Section */}
      <section id="beta" className="py-32 bg-landing-navy relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-landing-mint/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
            Sé el primero en ofrecer una experiencia de 5 estrellas automática.
          </h2>
          <p className="font-poppins text-white/70 mb-12 text-lg">
            Estamos abriendo plazas limitadas para nuestra beta privada. Asegura tu lugar y obtén beneficios exclusivos de por vida.
          </p>
          <div className="max-w-[500px] mx-auto">
            <BetaForm />
          </div>
        </div>
      </section>

      <FAQSection />
      <LandingFooter />
    </main>
  );
}
