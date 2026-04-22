"use client";

import React from 'react';
import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="py-20 bg-landing-navy text-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8">
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M32 6 C19 6 9 16 9 28 C9 41 22 53 32 60 C42 53 55 41 55 28 C55 16 45 6 32 6 Z" stroke="white" strokeWidth="4" fill="none"/>
                  <path d="M22 34 L29 41 L46 26" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-poppins font-bold text-xl tracking-tight">Hospyia</span>
            </div>
            <p className="font-poppins text-white/60 text-sm leading-relaxed">
              La nueva generación de guías digitales para alojamientos turísticos. Gestión inteligente, huéspedes felices.
            </p>
          </div>
          
          <div>
            <h4 className="font-poppins font-bold text-sm uppercase tracking-widest text-white/40 mb-6">Producto</h4>
            <ul className="space-y-4 font-poppins text-sm text-white/70">
              <li><Link href="#features" className="hover:text-landing-mint transition-colors">Funcionalidades</Link></li>
              <li><Link href="#themes" className="hover:text-landing-mint transition-colors">Temas</Link></li>
              <li><Link href="#beta" className="hover:text-landing-mint transition-colors">Beta Privada</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-sm uppercase tracking-widest text-white/40 mb-6">Compañía</h4>
            <ul className="space-y-4 font-poppins text-sm text-white/70">
              <li><Link href="/about" className="hover:text-landing-mint transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/privacy" className="hover:text-landing-mint transition-colors">Privacidad</Link></li>
              <li><Link href="/terms" className="hover:text-landing-mint transition-colors">Términos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-sm uppercase tracking-widest text-white/40 mb-6">Contacto</h4>
            <ul className="space-y-4 font-poppins text-sm text-white/70">
              <li><Link href="mailto:hola@hospyia.com" className="hover:text-landing-mint transition-colors">hola@hospyia.com</Link></li>
              <li className="flex gap-4 pt-2">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">𝕏</a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">📸</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 font-poppins text-xs text-white/40 uppercase tracking-widest">
          <p>© 2026 Hospyia. Todos los derechos reservados.</p>
          <p>Hecho con ♥️ en Madrid</p>
        </div>
      </div>
    </footer>
  );
};
