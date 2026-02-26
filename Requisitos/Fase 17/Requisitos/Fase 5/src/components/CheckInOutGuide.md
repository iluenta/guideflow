import React, { useState } from 'react';
import { MapPin, Key, DoorOpen, CheckSquare, Share2, Copy } from 'lucide-react';
export function CheckInOutGuide() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout'>('checkin');
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🔑</span> Guía de Acceso
      </h3>

      <div className="bg-white rounded-2xl shadow-card border border-stone-50 overflow-hidden">
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'checkin' ? 'text-terracotta border-b-2 border-terracotta bg-cream/30' : 'text-stone-400 hover:text-stone-600'}`}>

            Llegada
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'checkout' ? 'text-terracotta border-b-2 border-terracotta bg-cream/30' : 'text-stone-400 hover:text-stone-600'}`}>

            Salida
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'checkin' ?
          <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-charcoal mb-1">
                    Llegar a la dirección
                  </h4>
                  <p className="text-sm text-stone-600 mb-2">
                    Calle del Pez 12, 28004 Madrid
                  </p>
                  <button className="flex items-center gap-2 text-xs font-medium text-terracotta bg-terracotta/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                    <Share2 className="w-3 h-3" />
                    Compartir ubicación
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-charcoal mb-1">
                    Código del portero
                  </h4>
                  <div className="flex items-center gap-2 bg-stone-100 px-3 py-2 rounded-lg w-fit">
                    <span className="font-mono text-lg font-bold tracking-widest text-charcoal">
                      4532
                    </span>
                    <button className="text-stone-400 hover:text-terracotta">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-charcoal mb-1">
                    Subir al 2º piso
                  </h4>
                  <p className="text-sm text-stone-600">
                    Puedes usar el ascensor o las escaleras.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-charcoal mb-1">
                    Caja de llaves
                  </h4>
                  <p className="text-sm text-stone-600 mb-2">
                    Junto a la puerta 2B. Introduce el código:
                  </p>
                  <div className="flex items-center gap-2 bg-stone-100 px-3 py-2 rounded-lg w-fit">
                    <span className="font-mono text-lg font-bold tracking-widest text-charcoal">
                      1234
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage text-white flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-bold text-charcoal mb-1">
                    ¡Estás dentro!
                  </h4>
                  <p className="text-sm text-stone-600">
                    Usa la llave con etiqueta verde para abrir.
                  </p>
                </div>
              </div>
            </div> :

          <div className="space-y-4">
              <p className="text-sm text-stone-500 mb-4">
                Por favor, completa estos pasos antes de salir a las 11:00.
              </p>

              {[
            'Cerrar todas las ventanas',
            'Apagar luces y aire acondicionado',
            'Sacar la basura (contenedores en la calle)',
            'Dejar las llaves sobre la mesa del salón',
            'Cerrar la puerta al salir (sin llave)'].
            map((item, i) =>
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">

                  <CheckSquare className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-charcoal">
                    {item}
                  </span>
                </div>
            )}
            </div>
          }
        </div>
      </div>
    </section>);

}