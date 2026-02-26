import React from 'react';
import { Plane, Train, Bus, Bike, ExternalLink, MapPin } from 'lucide-react';
export function TransportInfo() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🚇</span> Transporte
      </h3>

      <div className="space-y-4">
        {/* How to arrive */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-50">
          <h4 className="font-bold text-charcoal mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terracotta" />
            Cómo llegar
          </h4>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="bg-blue-50 p-2 rounded-full text-blue-600 mt-0.5">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-charcoal text-sm">
                  Desde Aeropuerto Barajas
                </p>
                <p className="text-xs text-stone-500">
                  Metro L8 + L10 (45 min) o Taxi (~30€)
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-orange-50 p-2 rounded-full text-orange-600 mt-0.5">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-charcoal text-sm">
                  Desde Atocha Renfe
                </p>
                <p className="text-xs text-stone-500">
                  Metro L1 directo (15 min)
                </p>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 bg-stone-50 text-charcoal text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Abrir en Google Maps
          </button>
        </div>

        {/* Nearby Transport */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-50">
          <h4 className="font-bold text-charcoal mb-3">Transporte cercano</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-50 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                  M
                </div>
                <div>
                  <p className="font-medium text-charcoal text-sm">Metro Sol</p>
                  <p className="text-xs text-stone-500">
                    Líneas 1, 2, 3 • 5 min
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-stone-50 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-charcoal text-sm">
                    Parada Bus
                  </p>
                  <p className="text-xs text-stone-500">
                    Líneas 3, 51, 150 • 2 min
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-charcoal text-sm">BiciMAD</p>
                  <p className="text-xs text-stone-500">Estación 45 • 100m</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apps */}
        <div className="flex justify-between gap-2">
          {['Uber', 'Cabify', 'FreeNow', 'Citymapper'].map((app) =>
          <button
            key={app}
            className="flex-1 bg-white py-2 rounded-xl shadow-sm border border-stone-50 text-xs font-medium text-stone-600 active:scale-95 transition-transform">

              {app}
            </button>
          )}
        </div>
      </div>
    </section>);

}