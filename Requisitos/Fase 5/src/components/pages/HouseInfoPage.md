import React from 'react';
import { PageHeader } from '../PageHeader';
import { Home, Bed, Bath, Users, Ruler, ParkingCircle } from 'lucide-react';
interface HouseInfoPageProps {
  onBack: () => void;
}
export function HouseInfoPage({ onBack }: HouseInfoPageProps) {
  const features = [
  {
    icon: Bed,
    label: '2 Dormitorios',
    detail: 'Cama doble + 2 individuales'
  },
  {
    icon: Bath,
    label: '1 Baño completo',
    detail: 'Ducha y bañera'
  },
  {
    icon: Users,
    label: 'Hasta 4 huéspedes',
    detail: 'Ideal para familias'
  },
  {
    icon: Ruler,
    label: '75 m²',
    detail: 'Amplio y luminoso'
  },
  {
    icon: ParkingCircle,
    label: 'Parking incluido',
    detail: 'Plaza privada'
  }];

  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="House Info" onBack={onBack} />

      <div className="p-6">
        {/* Hero Image */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-soft">
          <img
            src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80"
            alt="Casa Rural El Refugio"
            className="w-full h-48 object-cover" />

        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl text-navy mb-2">
            Casa Rural El Refugio
          </h2>
          <p className="text-slate text-sm">Calle del Pez 12, 28004 Madrid</p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, i) =>
          <div
            key={i}
            className="bg-cream rounded-xl p-4 flex items-center gap-4 shadow-card">

              <div className="w-12 h-12 rounded-full bg-beige flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-navy" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-navy">{feature.label}</p>
                <p className="text-sm text-slate">{feature.detail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-8 bg-cream rounded-xl p-5 shadow-card">
          <h3 className="font-serif text-lg text-navy mb-3">
            Sobre la propiedad
          </h3>
          <p className="text-slate text-sm leading-relaxed">
            Encantador apartamento en el corazón de Malasaña, uno de los barrios
            más vibrantes de Madrid. Completamente reformado en 2023, combina el
            encanto tradicional con todas las comodidades modernas. A pocos
            pasos de Gran Vía, restaurantes, bares y tiendas.
          </p>
        </div>
      </div>
    </div>);

}