import React, { useState } from 'react';
import {
  Tv,
  Thermometer,
  Shirt,
  Utensils,
  Lock,
  Car,
  Trash2,
  ChevronDown,
  Wifi } from
'lucide-react';
const sections = [
{
  id: 'wifi',
  title: 'WiFi',
  icon: Wifi,
  content:
  'Red: CasaRefugio_Guest\nContraseña: ruralrelax2024\nEl router está en el salón, detrás de la TV.'
},
{
  id: 'tv',
  title: 'TV y Entretenimiento',
  icon: Tv,
  content:
  'La TV es Smart TV. Tienes acceso a Netflix (Usuario: Guest) y canales locales. El mando negro es para la TV y el blanco para el Chromecast.'
},
{
  id: 'climate',
  title: 'Climatización',
  icon: Thermometer,
  content:
  'El termostato está en el pasillo. Gira la rueda para ajustar la temperatura. Por favor, apágalo si sales de casa.'
},
{
  id: 'laundry',
  title: 'Lavadora y Secadora',
  icon: Shirt,
  content:
  'Están en la cocina. El detergente está en el armario bajo el fregadero. Programa corto recomendado: Eco 30°.'
},
{
  id: 'kitchen',
  title: 'Cocina',
  icon: Utensils,
  content:
  'Lavavajillas: pastillas bajo el fregadero. Cafetera: Nespresso (cápsulas en el bote rojo). Microondas y horno son intuitivos.'
},
{
  id: 'security',
  title: 'Seguridad',
  icon: Lock,
  content:
  'La alarma se desconecta automáticamente al abrir con la llave. La caja fuerte está en el armario del dormitorio principal (código: 0000 para resetear).'
},
{
  id: 'parking',
  title: 'Parking',
  icon: Car,
  content:
  'Plaza número 12 en el sótano -1. El mando del garaje está colgado junto a las llaves de casa.'
},
{
  id: 'trash',
  title: 'Basuras',
  icon: Trash2,
  content:
  'Por favor separa recicables. Contenedores en la esquina de la calle: Amarillo (plástico), Azul (papel), Verde (vidrio), Gris (resto).'
}];

export function HouseManual() {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📖</span> Manual de la Casa
      </h3>

      <div className="bg-white rounded-2xl shadow-card border border-stone-50 overflow-hidden divide-y divide-stone-100">
        {sections.map((section) =>
        <div key={section.id} className="bg-white">
            <button
            onClick={() =>
            setExpanded(expanded === section.id ? null : section.id)
            }
            className="w-full flex items-center justify-between p-4 text-left active:bg-stone-50 transition-colors">

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-terracotta">
                  <section.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-charcoal">
                  {section.title}
                </span>
              </div>
              <ChevronDown
              className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${expanded === section.id ? 'rotate-180 text-terracotta' : ''}`} />

            </button>

            <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded === section.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>

              <div className="p-4 pt-0 text-sm text-stone-600 whitespace-pre-line bg-stone-50/50">
                {section.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>);

}