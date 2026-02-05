import React from 'react';
import { Check, X, Clock } from 'lucide-react';
export function HouseRules() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📋</span> Normas de la Casa
      </h3>

      <div className="bg-white rounded-2xl shadow-card border border-stone-50 p-5">
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
            <span className="text-sm text-charcoal font-medium">
              Mascotas permitidas (pequeñas)
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
            <span className="text-sm text-charcoal font-medium">
              Niños bienvenidos
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
              <X className="w-3 h-3" strokeWidth={3} />
            </div>
            <span className="text-sm text-charcoal font-medium">
              No fumar en interior
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
              <X className="w-3 h-3" strokeWidth={3} />
            </div>
            <span className="text-sm text-charcoal font-medium">
              No fiestas ni eventos
            </span>
          </li>
          <li className="flex items-center gap-3 pt-2 border-t border-stone-100 mt-2">
            <Clock className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-600">
              Silencio:{' '}
              <span className="font-bold text-charcoal">22:00 - 8:00</span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-600">
              Check-in:{' '}
              <span className="font-bold text-charcoal">15:00 - 22:00</span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-600">
              Check-out:{' '}
              <span className="font-bold text-charcoal">antes 11:00</span>
            </span>
          </li>
        </ul>
        <p className="text-center text-xs text-stone-400 mt-4 italic">
          Gracias por respetar estas normas 🙏
        </p>
      </div>
    </section>);

}