import React from 'react';
import { PageHeader } from '../PageHeader';
import {
  Wifi,
  Tv,
  AirVent,
  Car,
  WashingMachine,
  UtensilsCrossed,
  Coffee,
  Microwave,
  Bath,
  Shirt,
  Refrigerator,
  Lock,
  Check,
  X } from
'lucide-react';
interface AmenitiesPageProps {
  onBack: () => void;
}
export function AmenitiesPage({ onBack }: AmenitiesPageProps) {
  const amenities = [
  {
    icon: Wifi,
    label: 'WiFi',
    available: true
  },
  {
    icon: Tv,
    label: 'Smart TV',
    available: true
  },
  {
    icon: AirVent,
    label: 'Aire acondicionado',
    available: true
  },
  {
    icon: Car,
    label: 'Parking',
    available: true
  },
  {
    icon: WashingMachine,
    label: 'Lavadora',
    available: true
  },
  {
    icon: UtensilsCrossed,
    label: 'Cocina equipada',
    available: true
  },
  {
    icon: Coffee,
    label: 'Cafetera Nespresso',
    available: true
  },
  {
    icon: Microwave,
    label: 'Microondas',
    available: true
  },
  {
    icon: Bath,
    label: 'Bañera',
    available: false
  },
  {
    icon: Shirt,
    label: 'Plancha',
    available: true
  },
  {
    icon: Refrigerator,
    label: 'Nevera',
    available: true
  },
  {
    icon: Lock,
    label: 'Caja fuerte',
    available: true
  }];

  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="Amenities" onBack={onBack} />

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {amenities.map((item, i) =>
          <div
            key={i}
            className={`bg-cream rounded-xl p-4 shadow-card flex items-center gap-3 ${!item.available ? 'opacity-50' : ''}`}>

              <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${item.available ? 'bg-beige text-navy' : 'bg-slate/10 text-slate'}`}>

                <item.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p
                className={`text-sm font-medium ${item.available ? 'text-navy' : 'text-slate line-through'}`}>

                  {item.label}
                </p>
              </div>
              {item.available ?
            <Check className="w-4 h-4 text-green-600" strokeWidth={2} /> :

            <X className="w-4 h-4 text-slate" strokeWidth={2} />
            }
            </div>
          )}
        </div>
      </div>
    </div>);

}