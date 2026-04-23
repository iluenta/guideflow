"use client";

import React from 'react';

export const LandingFooter = () => {
  return (
    <footer className="py-20 bg-white border-t border-landing-rule">
      <div className="wrap">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-[300px]">
             <div className="flex items-center gap-[10px] font-poppins text-2xl font-bold tracking-tighter text-landing-navy mb-6">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M32 6 C19 6 9 16 9 28 C9 41 22 53 32 60 C42 53 55 41 55 28 C55 16 45 6 32 6 Z" stroke="#1e3a8a" strokeWidth="4.5" strokeLinejoin="round" fill="none"/>
                    <path d="M19 22 Q23 19 27 22" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M16 18 Q23 13 30 18" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M22 34 L29 41 L46 26" stroke="#1e3a8a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <circle cx="48" cy="20" r="3" fill="#2dd4bf"/>
                  </svg>
                </div>
                <span>Hospyia</span>
             </div>
             <p className="text-landing-ink/50 text-[14px] leading-relaxed">
               Redefiniendo la hospitalidad con inteligencia artificial. Creado con cariño para anfitriones que cuidan cada detalle.
             </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
             <div>
                <h4 className="font-poppins font-bold text-landing-navy text-[14px] mb-6 uppercase tracking-widest">Producto</h4>
                <ul className="space-y-4 text-[14px] text-landing-ink/60">
                   <li><a href="#features" className="hover:text-landing-navy transition-colors">Características</a></li>
                   <li><a href="#themes" className="hover:text-landing-navy transition-colors">Temas</a></li>
                   <li><a href="#how" className="hover:text-landing-navy transition-colors">Proceso</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-poppins font-bold text-landing-navy text-[14px] mb-6 uppercase tracking-widest">Legal</h4>
                <ul className="space-y-4 text-[14px] text-landing-ink/60">
                   <li><a href="#" className="hover:text-landing-navy transition-colors">Privacidad</a></li>
                   <li><a href="#" className="hover:text-landing-navy transition-colors">Términos</a></li>
                   <li><a href="#" className="hover:text-landing-navy transition-colors">Cookies</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-poppins font-bold text-landing-navy text-[14px] mb-6 uppercase tracking-widest">Contacto</h4>
                <ul className="space-y-4 text-[14px] text-landing-ink/60">
                   <li><a href="mailto:hola@hospyia.com" className="hover:text-landing-navy transition-colors">hola@hospyia.com</a></li>
                   <li><a href="#" className="hover:text-landing-navy transition-colors">LinkedIn</a></li>
                   <li><a href="#" className="hover:text-landing-navy transition-colors">X (Twitter)</a></li>
                </ul>
             </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-landing-rule flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="font-jetbrains text-[11px] text-landing-ink/30 uppercase tracking-widest">
              © {new Date().getFullYear()} HOSPYIA LABS S.L. · HECHO EN MADRID
           </div>
           <div className="flex items-center gap-2 text-[11px] font-jetbrains text-landing-ink/30 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-landing-mint"></span>
              Sistemas operativos
           </div>
        </div>
      </div>
    </footer>
  );
};
