"use client";

import { Info, Lightbulb, Home, Building2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeProgress = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-3 group">
    <div className="flex justify-between items-center gap-4">
      <p className="text-[10px] font-bold text-[#191C1C]/40 uppercase tracking-[0.25em] font-manrope">{label}</p>
      <p className="text-[10px] font-black text-[#191C1C]/20 font-inter">{value}%</p>
    </div>
    <div className="relative h-[6px] w-full bg-[#E6EBE9] rounded-full overflow-hidden">
      <div 
        className="absolute top-0 left-0 h-full rounded-full bg-[#124340] opacity-80"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const SidebarMockup = () => {
  return (
    <div className="space-y-10">
      {/* Temas más consultados from Image 2 */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm shadow-[#124340]/5 space-y-10 border border-[#124340]/5">
        <div className="flex items-center justify-between">
           <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#124340] font-manrope">Temas Más Consultados</h3>
           <Info size={16} className="text-[#124340]/20" />
        </div>
        <div className="space-y-8">
          <ThemeProgress label="Servicios" value={82} />
          <ThemeProgress label="Entrada/Salida" value={64} />
          <ThemeProgress label="Normas de la Casa" value={41} />
          <ThemeProgress label="Sugerencias Locales" value={29} />
        </div>
      </div>

      {/* Curator Insight - Correct Dark Variant from Image 2 */}
      <div className="bg-[#2D5A57] p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl">
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-3">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] font-manrope">Análisis del Curador</h3>
           </div>
           <p className="text-sm font-inter leading-relaxed opacity-80 font-light">
             Las preguntas sobre servicios han subido un 12% esta semana. Considera actualizar la sección 'Acceso a la Piscina' en tu guía.
           </p>
        </div>
        <div className="absolute bottom-4 right-4 text-white/10">
           <Lightbulb size={60} strokeWidth={1} />
        </div>
      </div>

      {/* Top Properties from Image 2 */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm shadow-[#124340]/5 space-y-8 border border-[#124340]/5 relative overflow-hidden">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#124340] font-manrope">Propiedades Principales</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F2F4F3] flex items-center justify-center text-[#124340]/40">
                <Home size={18} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold text-[#191C1C] font-manrope">Villa Vista al Mar</p>
            </div>
            <p className="text-[10px] font-bold text-[#191C1C]/20 font-inter">45</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F2F4F3] flex items-center justify-center text-[#124340]/40">
                <Building2 size={18} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold text-[#191C1C] font-manrope">Loft Urbano A12</p>
            </div>
            <p className="text-[10px] font-bold text-[#191C1C]/20 font-inter">32 chats</p>
          </div>
        </div>

        {/* Floating Plus Button from Image 2 */}
        <div className="absolute bottom-4 right-4">
           <button className="w-12 h-12 rounded-2xl bg-[#124340] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all">
              <Plus size={24} />
           </button>
        </div>
      </div>
    </div>
  );
};
