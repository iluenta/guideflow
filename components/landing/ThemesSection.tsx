"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const THEMES = [
  {
    id: 'minimal',
    name: 'Nórdico',
    description: 'Limpio, blanco y funcional. Ideal para apartamentos modernos.',
    colors: ['#FFFFFF', '#F3F4F6', '#111827'],
    previewClass: 'bg-white border-gray-100'
  },
  {
    id: 'boutique',
    name: 'Boutique Dark',
    description: 'Elegancia en tonos oscuros para experiencias premium.',
    colors: ['#0F172A', '#1E293B', '#F8FAFC'],
    previewClass: 'bg-slate-900 border-slate-800'
  },
  {
    id: 'nature',
    name: 'Bosque',
    description: 'Tonos tierra y verdes para casas rurales y retiros.',
    colors: ['#FDFCFB', '#E5E7EB', '#064E3B'],
    previewClass: 'bg-[#FDFCFB] border-green-100'
  },
  {
    id: 'ocean',
    name: 'Mediterráneo',
    description: 'Azules frescos y blancos luminosos para la costa.',
    colors: ['#F0F9FF', '#E0F2FE', '#0369A1'],
    previewClass: 'bg-sky-50 border-sky-100'
  }
];

export const ThemesSection = () => {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);

  return (
    <section id="themes" className="py-32 bg-landing-bg overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2">
            <h2 className="font-poppins font-bold text-4xl md:text-5xl text-landing-navy mb-6 leading-tight">
              Personaliza tu guía con <span className="text-landing-mint">un toque</span>.
            </h2>
            <p className="font-poppins text-landing-ink/70 text-lg mb-12">
              Elige el estilo que mejor se adapte a tu marca y a la decoración de tu alojamiento. Cambia colores y tipografías al instante.
            </p>

            <div className="grid gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme)}
                  className={cn(
                    "flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 text-left",
                    activeTheme.id === theme.id 
                      ? "bg-white border-landing-mint shadow-xl scale-[1.02]" 
                      : "bg-transparent border-landing-rule hover:border-landing-ink/20"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {theme.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="font-poppins font-bold text-landing-navy">{theme.name}</p>
                      <p className="text-sm text-landing-ink/50">{theme.description}</p>
                    </div>
                  </div>
                  {activeTheme.id === theme.id && (
                    <div className="bg-landing-mint/10 p-2 rounded-full">
                      <Check className="w-5 h-5 text-landing-mint" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative">
            {/* Mockup Preview with Dynamic Theme */}
            <div className={cn(
              "aspect-[4/3] rounded-3xl shadow-2xl border p-8 transition-all duration-700 relative overflow-hidden",
              activeTheme.previewClass
            )}>
              <div className="w-full h-full flex flex-col gap-6">
                <div className="h-12 w-48 rounded-lg opacity-20" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                <div className="h-4 w-full rounded-full opacity-10" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                <div className="h-4 w-2/3 rounded-full opacity-10" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="h-32 rounded-2xl opacity-20" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                  <div className="h-32 rounded-2xl opacity-20" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                </div>

                <div className="mt-auto flex justify-between items-center">
                   <div className="h-10 w-10 rounded-full opacity-30" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                   <div className="h-10 w-32 rounded-xl opacity-30" style={{ backgroundColor: activeTheme.colors[2] }}></div>
                </div>
              </div>
              
              {/* Floating label */}
              <div className="absolute top-6 right-6 bg-white shadow-lg rounded-full px-4 py-2 border border-landing-rule">
                 <span className="text-[10px] font-jetbrains font-bold text-landing-navy uppercase tracking-wider">Preview: {activeTheme.name}</span>
              </div>
            </div>

            {/* Decorative dots */}
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-landing-mint/5 rounded-full blur-[80px] -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
