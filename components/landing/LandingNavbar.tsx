"use client";

import React from 'react';
import Link from 'next/link';

export const LandingNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M32 6 C19 6 9 16 9 28 C9 41 22 53 32 60 C42 53 55 41 55 28 C55 16 45 6 32 6 Z" stroke="#1e3a8a" strokeWidth="4.5" strokeLinejoin="round" fill="none"/>
              <path d="M19 22 Q23 19 27 22" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M16 18 Q23 13 30 18" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M22 34 L29 41 L46 26" stroke="#1e3a8a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="48" cy="20" r="3" fill="#2dd4bf"/>
            </svg>
          </div>
          <span className="font-poppins font-bold text-2xl tracking-tight text-landing-navy">Hospyia</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="font-poppins text-[15px] font-medium text-landing-ink/70 hover:text-landing-navy transition-colors">Producto</Link>
          <Link href="#themes" className="font-poppins text-[15px] font-medium text-landing-ink/70 hover:text-landing-navy transition-colors">Temas</Link>
          <Link href="#how" className="font-poppins text-[15px] font-medium text-landing-ink/70 hover:text-landing-navy transition-colors">Cómo funciona</Link>
          <Link href="#faq" className="font-poppins text-[15px] font-medium text-landing-ink/70 hover:text-landing-navy transition-colors">FAQ</Link>
          <Link href="#beta" className="bg-landing-navy text-white px-6 py-3 rounded-full font-poppins font-semibold text-[15px] hover:shadow-lg hover:shadow-landing-navy/20 transition-all active:scale-95">
            Unirme a la beta
          </Link>
        </div>
      </div>
    </nav>
  );
};
