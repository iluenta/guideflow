import React from 'react';
import { Key, Wifi, UtensilsCrossed, AlertCircle } from 'lucide-react';
const actions = [
{
  icon: Key,
  label: 'Entrada',
  color: 'bg-terracotta'
},
{
  icon: Wifi,
  label: 'WiFi',
  color: 'bg-terracotta'
},
{
  icon: UtensilsCrossed,
  label: 'Comer',
  color: 'bg-terracotta'
},
{
  icon: AlertCircle,
  label: 'SOS',
  color: 'bg-red-500'
}];

export function QuickAccess() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>⚡</span> Acceso Rápido
      </h3>

      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) =>
        <button
          key={action.label}
          className="flex flex-col items-center gap-2 group">

            <div
            className={`${action.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shadow-terracotta/20 group-active:scale-90 transition-transform duration-200`}>

              <action.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-charcoal/80">
              {action.label}
            </span>
          </button>
        )}
      </div>
    </section>);

}