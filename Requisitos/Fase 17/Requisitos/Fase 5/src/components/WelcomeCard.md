import React from 'react';
import { Calendar, Clock, Play } from 'lucide-react';
export function WelcomeCard() {
  return (
    <div className="px-4 -mt-6 relative z-10 mb-6">
      <div className="bg-white rounded-2xl shadow-card p-5 border border-stone-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-charcoal">
            <span className="mr-2">👋</span>
            Bienvenido/a, Sarah!
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-cream rounded-xl p-3 flex flex-col">
            <div className="flex items-center gap-2 text-terracotta mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Check-in
              </span>
            </div>
            <span className="text-charcoal font-semibold">Hoy 15:00</span>
          </div>

          <div className="bg-cream rounded-xl p-3 flex flex-col">
            <div className="flex items-center gap-2 text-sage mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Check-out
              </span>
            </div>
            <span className="text-charcoal font-semibold">
              2 días restantes
            </span>
          </div>
        </div>

        <button className="w-full bg-charcoal text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium active:scale-[0.98] transition-transform shadow-md shadow-charcoal/10">
          <div className="bg-white/20 rounded-full p-1">
            <Play className="w-3 h-3 fill-current" />
          </div>
          Ver mensaje personal
        </button>
      </div>
    </div>);

}