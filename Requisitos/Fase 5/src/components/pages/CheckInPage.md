import React from 'react';
import { PageHeader } from '../PageHeader';
import {
  MapPin,
  Key,
  Building,
  DoorOpen,
  Copy,
  ExternalLink } from
'lucide-react';
interface CheckInPageProps {
  onBack: () => void;
}
export function CheckInPage({ onBack }: CheckInPageProps) {
  const steps = [
  {
    icon: MapPin,
    title: 'Dirección',
    content: 'Calle del Pez 12, 28004 Madrid',
    action: {
      label: 'Ver en mapa',
      icon: ExternalLink
    }
  },
  {
    icon: Building,
    title: 'Código del portero',
    content: '4532',
    copyable: true
  },
  {
    icon: Key,
    title: 'Caja de llaves',
    content: 'Junto a la puerta 2B. Código: 1234',
    copyable: true
  },
  {
    icon: DoorOpen,
    title: 'Tu apartamento',
    content: '2º piso, puerta verde. Usa la llave con etiqueta verde.'
  }];

  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="Check In" onBack={onBack} />

      <div className="p-6">
        {/* Time info */}
        <div className="bg-cream rounded-xl p-5 mb-6 shadow-card text-center">
          <p className="text-slate text-sm uppercase tracking-wide mb-1">
            Check-in disponible
          </p>
          <p className="font-serif text-2xl text-navy">15:00 - 22:00</p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) =>
          <div key={i} className="bg-cream rounded-xl p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-navy text-cream flex items-center justify-center font-serif font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon
                    className="w-4 h-4 text-navy"
                    strokeWidth={1.5} />

                    <h3 className="font-medium text-navy">{step.title}</h3>
                  </div>
                  <p className="text-slate text-sm">{step.content}</p>

                  {step.copyable &&
                <button className="mt-3 flex items-center gap-2 text-xs font-medium text-navy bg-beige px-3 py-1.5 rounded-full">
                      <Copy className="w-3 h-3" />
                      Copiar código
                    </button>
                }

                  {step.action &&
                <button className="mt-3 flex items-center gap-2 text-xs font-medium text-navy bg-beige px-3 py-1.5 rounded-full">
                      <step.action.icon className="w-3 h-3" />
                      {step.action.label}
                    </button>
                }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help note */}
        <div className="mt-6 text-center">
          <p className="text-slate text-sm">
            ¿Problemas para entrar? Llama a María:{' '}
            <span className="text-navy font-medium">666 123 456</span>
          </p>
        </div>
      </div>
    </div>);

}