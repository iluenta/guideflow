import React from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';
export function WeatherWidget() {
  return (
    <section className="px-4 mb-6">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 shadow-sm border border-orange-100/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sun className="w-10 h-10 text-orange-500" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-charcoal">24°</span>
                <span className="text-sm font-medium text-stone-500">
                  Soleado
                </span>
              </div>
              <div className="text-xs text-stone-400 font-medium">
                H: 28° L: 18°
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-terracotta uppercase tracking-wide mb-1">
              Hoy
            </p>
            <p className="text-[10px] text-stone-500 max-w-[100px] leading-tight">
              Perfecto para pasear por el Retiro
            </p>
          </div>
        </div>

        <div className="flex justify-between border-t border-orange-200/30 pt-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-stone-400">MAÑ</span>
            <Cloud className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-medium text-charcoal">22°</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-stone-400">MIE</span>
            <Sun className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-charcoal">25°</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-stone-400">JUE</span>
            <CloudRain className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-charcoal">19°</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-stone-400">VIE</span>
            <Sun className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-charcoal">23°</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-stone-400">SAB</span>
            <Sun className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-charcoal">26°</span>
          </div>
        </div>
      </div>
    </section>);

}