import React from 'react';
import { MapPin, Clock } from 'lucide-react';
const services = [
{
  name: 'Mercadona',
  type: 'Supermercado',
  dist: '200m',
  time: '9-21h',
  emoji: '🛒'
},
{
  name: 'Farmacia López',
  type: 'Farmacia',
  dist: '150m',
  time: '24h',
  emoji: '💊'
},
{
  name: 'Cajero Santander',
  type: 'Banco',
  dist: '100m',
  time: '24h',
  emoji: '🏧'
},
{
  name: 'Repsol',
  type: 'Gasolinera',
  dist: '500m',
  time: '24h',
  emoji: '⛽'
},
{
  name: 'Lavandería Express',
  type: 'Lavandería',
  dist: '300m',
  time: '8-20h',
  emoji: '👕'
},
{
  name: 'Correos',
  type: 'Oficina Postal',
  dist: '400m',
  time: '9-14h',
  emoji: '📬'
}];

export function NeighborhoodServices() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🏘️</span> Servicios del Barrio
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {services.map((service) =>
        <div
          key={service.name}
          className="bg-white p-3 rounded-xl shadow-sm border border-stone-50 flex flex-col gap-2 active:scale-[0.98] transition-transform cursor-pointer">

            <div className="flex justify-between items-start">
              <span className="text-2xl">{service.emoji}</span>
              <span className="text-[10px] font-medium bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {service.dist}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-charcoal text-sm leading-tight">
                {service.name}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
                <Clock className="w-3 h-3" />
                <span>{service.time}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>);

}