import React, { useState } from 'react';
import { PageHeader } from '../PageHeader';
import {
  Tv,
  Thermometer,
  Shirt,
  UtensilsCrossed,
  Lock,
  Car,
  Trash2,
  ChevronDown,
  Wifi } from
'lucide-react';
interface GuidesPageProps {
  onBack: () => void;
}
const guides = [
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
  icon: UtensilsCrossed,
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
  'Por favor separa reciclables. Contenedores en la esquina: Amarillo (plástico), Azul (papel), Verde (vidrio), Gris (resto).'
}];

export function GuidesPage({ onBack }: GuidesPageProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="How-To Guides" onBack={onBack} />

      <div className="p-6">
        <div className="space-y-3">
          {guides.map((guide) =>
          <div
            key={guide.id}
            className="bg-cream rounded-xl shadow-card overflow-hidden">

              <button
              onClick={() =>
              setExpanded(expanded === guide.id ? null : guide.id)
              }
              className="w-full p-4 flex items-center justify-between text-left">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-beige flex items-center justify-center text-navy">
                    <guide.icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-navy">{guide.title}</span>
                </div>
                <ChevronDown
                className={`w-5 h-5 text-slate transition-transform duration-300 ${expanded === guide.id ? 'rotate-180' : ''}`} />

              </button>

              <div
              className={`overflow-hidden transition-all duration-300 ${expanded === guide.id ? 'max-h-96' : 'max-h-0'}`}>

                <div className="px-4 pb-4 text-sm text-slate whitespace-pre-line border-t border-beige pt-3">
                  {guide.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

}