"use client";

import React from 'react';
import Link from 'next/link';

export const LandingNavbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-[rgba(250,251,252,0.85)] backdrop-blur-md border-b border-landing-rule/30">
      <div className="wrap h-[68px] flex items-center justify-between">
        <div className="flex items-center gap-[10px] font-poppins text-2xl font-bold tracking-tighter text-landing-navy">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M32 6 C19 6 9 16 9 28 C9 41 22 53 32 60 C42 53 55 41 55 28 C55 16 45 6 32 6 Z" stroke="#1e3a8a" strokeWidth="4.5" strokeLinejoin="round" fill="none"/>
              <path d="M19 22 Q23 19 27 22" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M16 18 Q23 13 30 18" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M22 34 L29 41 L46 26" stroke="#1e3a8a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="48" cy="20" r="3" fill="#2dd4bf"/>
            </svg>
          </div>
          <span className="leading-none">Hospyia</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[14px] text-landing-ink/60 font-medium">
          <a href="#features" className="hover:text-landing-ink transition-colors">Producto</a>
          <a href="#themes" className="hover:text-landing-ink transition-colors">Temas</a>
          <a href="#how" className="hover:text-landing-ink transition-colors">Cómo funciona</a>
          <a href="#faq" className="hover:text-landing-ink transition-colors">FAQ</a>
          <a href="#beta" className="bg-landing-navy text-white px-[18px] py-[10px] rounded-full font-poppins font-medium text-[14px] hover:bg-[#15296b] transition-all">
            Unirme a la beta
          </a>
        </div>
      </div>
    </nav>
  );
};
