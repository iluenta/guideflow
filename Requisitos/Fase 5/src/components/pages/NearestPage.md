import React from 'react';
import { PageHeader } from '../PageHeader';
import { MapPin, Clock } from 'lucide-react';
interface NearestPageProps {
  onBack: () => void;
}
export function NearestPage({ onBack }: NearestPageProps) {
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

  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="Your Nearest" onBack={onBack} />

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {services.map((service, i) =>
          <div key={i} className="bg-cream rounded-xl p-4 shadow-card">
              <div className="flex justify-between items-start mb-3">
                <span className="text-2xl">{service.emoji}</span>
                <span className="text-[10px] font-medium bg-beige text-slate px-2 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {service.dist}
                </span>
              </div>
              <h4 className="font-medium text-navy text-sm">{service.name}</h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate">
                <Clock className="w-3 h-3" />
                <span>{service.time}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

}