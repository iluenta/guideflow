import React from 'react';
import { PageHeader } from '../PageHeader';
import { Plane, Train, Bus, Bike, MapPin, ExternalLink } from 'lucide-react';
interface TransportPageProps {
  onBack: () => void;
}
export function TransportPage({ onBack }: TransportPageProps) {
  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="Transportation" onBack={onBack} />

      <div className="p-6">
        {/* How to arrive */}
        <h3 className="font-serif text-lg text-navy mb-4">Cómo llegar</h3>
        <div className="space-y-3 mb-8">
          <div className="bg-cream rounded-xl p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-navy text-sm">
                  Desde Aeropuerto Barajas
                </p>
                <p className="text-slate text-xs mt-1">
                  Metro L8 + L10 (45 min) o Taxi (~30€)
                </p>
              </div>
            </div>
          </div>
          <div className="bg-cream rounded-xl p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-navy text-sm">
                  Desde Atocha Renfe
                </p>
                <p className="text-slate text-xs mt-1">
                  Metro L1 directo (15 min)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby transport */}
        <h3 className="font-serif text-lg text-navy mb-4">
          Transporte cercano
        </h3>
        <div className="bg-cream rounded-xl shadow-card overflow-hidden mb-6">
          <div className="p-4 border-b border-beige flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
              M
            </div>
            <div>
              <p className="font-medium text-navy text-sm">Metro Sol</p>
              <p className="text-slate text-xs">Líneas 1, 2, 3 • 5 min</p>
            </div>
          </div>
          <div className="p-4 border-b border-beige flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-navy text-sm">Parada Bus</p>
              <p className="text-slate text-xs">Líneas 3, 51, 150 • 2 min</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-navy text-sm">BiciMAD</p>
              <p className="text-slate text-xs">Estación 45 • 100m</p>
            </div>
          </div>
        </div>

        {/* Apps */}
        <h3 className="font-serif text-lg text-navy mb-4">Apps recomendadas</h3>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {['Uber', 'Cabify', 'FreeNow', 'Citymapper'].map((app) =>
          <button
            key={app}
            className="bg-cream py-3 rounded-xl shadow-card text-xs font-medium text-navy">

              {app}
            </button>
          )}
        </div>

        {/* Map button */}
        <button className="w-full bg-navy text-cream py-3 rounded-xl font-medium flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          Abrir en Google Maps
        </button>
      </div>
    </div>);

}