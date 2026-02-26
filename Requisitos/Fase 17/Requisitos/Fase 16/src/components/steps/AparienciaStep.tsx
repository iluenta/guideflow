import React from 'react';
import { Card } from '../ui/Card';
import { Check, Palette, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
interface AparienciaData {
  theme: string;
  brandColor: string;
  logoUrl?: string;
}
interface AparienciaStepProps {
  data: AparienciaData;
  onChange: (data: Partial<AparienciaData>) => void;
}
export function AparienciaStep({ data, onChange }: AparienciaStepProps) {
  const themes = [
  {
    id: 'naval',
    name: 'ELEGANTE NAVAL',
    subtitle: 'PROFESIONAL Y SOFISTICADO',
    headerColor: 'bg-[#1e3a8a]',
    dots: ['bg-[#1e3a8a]', 'bg-amber-400', 'bg-teal-500']
  },
  {
    id: 'terracotta',
    name: 'TERRACOTA CÁLIDO',
    subtitle: 'ACOGEDOR Y MEDITERRÁNEO',
    headerColor: 'bg-[#c2410c]',
    dots: ['bg-[#c2410c]', 'bg-[#1e3a8a]', 'bg-amber-600']
  },
  {
    id: 'forest',
    name: 'VERDE BOSQUE',
    subtitle: 'NATURAL Y RELAJANTE',
    headerColor: 'bg-[#065f46]',
    dots: ['bg-[#065f46]', 'bg-[#7c2d12]', 'bg-[#ea580c]']
  },
  {
    id: 'minimal',
    name: 'MINIMALISTA MODERNO',
    subtitle: 'LIMPIO Y CONTEMPORÁNEO',
    headerColor: 'bg-[#111827]',
    dots: ['bg-[#111827]', 'bg-[#4b5563]', 'bg-[#3b82f6]']
  }];

  return (
    <Card
      title="Apariencia de tu Guía"
      description="Elige un tema y personaliza los colores de tu guía mágica.">

      <div className="space-y-10">
        {/* Theme Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-pink-300"></span>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              ELIGE UN TEMA BASE
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {themes.map((theme) => {
              const isSelected = data.theme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() =>
                  onChange({
                    theme: theme.id
                  })
                  }
                  className="cursor-pointer group">

                  {/* Preview Card */}
                  <div
                    className={`relative bg-white rounded-lg border-2 overflow-hidden mb-3 transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-gray-100 group-hover:border-gray-200'}`}>

                    {isSelected &&
                    <div className="absolute top-2 right-2 z-10 bg-primary text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    }
                    {/* Header Bar */}
                    <div
                      className={`h-8 w-full ${theme.headerColor} mb-2`}>
                    </div>
                    {/* Content Lines */}
                    <div className="px-3 pb-4 space-y-2">
                      <div className="flex gap-2">
                        <div className="w-1/3 h-12 bg-gray-50 rounded"></div>
                        <div className="w-1/3 h-12 bg-gray-50 rounded"></div>
                        <div className="w-1/3 h-12 bg-gray-50 rounded flex items-center justify-center">
                          <div
                            className={`w-2 h-2 rounded-full ${theme.dots[2]}`}>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-50 rounded-full"></div>
                    </div>
                    {/* Bottom Curve */}
                    <div className="h-1 w-full flex">
                      <div
                        className={`w-1/4 h-full ${theme.dots[0]} rounded-tr-full`}>
                      </div>
                    </div>
                  </div>

                  {/* Labels */}
                  <h4 className="text-sm font-bold text-text-primary uppercase">
                    {theme.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
                    {theme.subtitle}
                  </p>

                  {/* Dots */}
                  <div className="flex gap-2">
                    {theme.dots.map((dot, i) =>
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${dot}`}>
                    </div>
                    )}
                    <div className="flex gap-0.5 items-center">
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                </div>);

            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
          {/* Brand Color */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-pink-300"></span>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                COLOR DE MARCA (OPCIONAL)
              </h3>
            </div>

            <label className="block text-sm font-bold text-text-primary mb-3">
              Color Principal
            </label>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#1e3a8a] border-2 border-gray-200 cursor-pointer"></div>
              <div className="w-16 h-10 rounded border border-gray-200 bg-[#1e3a8a]"></div>
              <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono text-gray-600 border border-gray-200">
                #1e3a8a
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">
              * El sistema ajustará automáticamente los colores secundarios para
              mantener la armonía visual.
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-3 h-3 text-green-300" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                LOGO DE LA PROPIEDAD
              </h3>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50">
              <Upload className="w-8 h-8 text-gray-300 mb-3" />
              <h4 className="text-sm font-bold text-text-primary mb-1">
                Sube tu logotipo
              </h4>
              <p className="text-xs text-gray-400 mb-4">
                PNG o SVG ligero (Max 500KB)
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white border-gray-200 text-xs font-bold tracking-wide">

                SELECCIONAR ARCHIVO
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>);

}