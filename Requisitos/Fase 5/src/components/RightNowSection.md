import React from 'react';
import { Sunrise, MapPin, ArrowRight, Wine } from 'lucide-react';
export function RightNowSection() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📍</span> Ahora mismo (17:30)
      </h3>

      <div className="space-y-3">
        {/* Sunset Card */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-50 border-l-4 border-l-terracotta flex items-center justify-between group active:bg-stone-50 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-2.5 rounded-full text-orange-600">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-charcoal">Atardecer en 1 hora</h4>
              <div className="flex items-center gap-1 text-sm text-stone-500 mt-1">
                <MapPin className="w-3 h-3" />
                <span>Templo de Debod - 20 min</span>
              </div>
              <p className="text-xs font-medium text-terracotta mt-2 bg-terracotta/10 inline-block px-2 py-0.5 rounded-md">
                Puesta de sol: 18:45
              </p>
            </div>
          </div>
          <div className="text-stone-300 group-hover:text-terracotta transition-colors">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        {/* Tapas Card */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-50 border-l-4 border-l-sage flex items-center justify-between group active:bg-stone-50 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-2.5 rounded-full text-red-600">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-charcoal">Hora de tapas</h4>
              <div className="flex items-center gap-1 text-sm text-stone-500 mt-1">
                <MapPin className="w-3 h-3" />
                <span>Ruta La Latina - 15 min</span>
              </div>
              <p className="text-xs font-medium text-sage mt-2 bg-sage/10 inline-block px-2 py-0.5 rounded-md">
                Recomendado
              </p>
            </div>
          </div>
          <div className="text-stone-300 group-hover:text-sage transition-colors">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </section>);

}