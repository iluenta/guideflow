import React from 'react';
import {
  Wifi,
  Tv,
  AirVent,
  Car,
  WashingMachine,
  Utensils,
  Coffee,
  Microwave,
  Bath,
  Shirt,
  Snowflake,
  Lock } from
'lucide-react';
const amenities = [
{
  icon: Wifi,
  label: 'WiFi',
  available: true
},
{
  icon: Tv,
  label: 'TV',
  available: true
},
{
  icon: AirVent,
  label: 'A/C',
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
  icon: Utensils,
  label: 'Cocina',
  available: true
},
{
  icon: Coffee,
  label: 'Café',
  available: true
},
{
  icon: Microwave,
  label: 'Micro',
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
  icon: Snowflake,
  label: 'Nevera',
  available: true
},
{
  icon: Lock,
  label: 'Caja Fuerte',
  available: true
}];

export function AmenitiesGrid() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>✨</span> Amenities
      </h3>

      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
        {amenities.map((item, i) =>
        <div key={i} className="flex flex-col items-center gap-2">
            <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${item.available ? 'bg-sage/10 text-sage' : 'bg-stone-100 text-stone-300'}`}>

              <item.icon
              className="w-5 h-5"
              strokeWidth={item.available ? 2 : 1.5} />

              {!item.available &&
            <div className="absolute w-12 h-[1px] bg-stone-300 rotate-45" />
            }
            </div>
            <span
            className={`text-[10px] font-medium text-center ${item.available ? 'text-charcoal' : 'text-stone-300 line-through'}`}>

              {item.label}
            </span>
          </div>
        )}
      </div>
    </section>);

}