import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import {
  CheckCircle,
  MapPin,
  Sparkles,
  Plane,
  Train,
  Car,
  Bus,
  Plus,
  AlertTriangle } from
'lucide-react';
interface AccesoData {
  address: string;
}
interface AccesoStepProps {
  data: AccesoData;
  onChange: (data: Partial<AccesoData>) => void;
}
export function AccesoStep({ data, onChange }: AccesoStepProps) {
  return (
    <Card
      title="Llegada y Acceso"
      description="Cómo llegan tus huéspedes y cómo entran a la casa.">

      <div className="space-y-6">
        {/* Address Section */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Dirección Completa
          </label>
          <div className="relative">
            <input
              value={data.address}
              onChange={(e) =>
              onChange({
                address: e.target.value
              })
              }
              className="w-full h-11 rounded-lg border border-green-500 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20" />

            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          </div>
        </div>

        {/* AI Tip */}
        <div className="bg-blue-50 rounded-lg p-3 flex gap-2 text-xs text-blue-700">
          <span className="font-bold whitespace-nowrap">Tip de IA:</span>
          <p>
            Introduce solo Calle, Número y Ciudad. Evita portal, piso o letra
            para que la IA proporcione transporte y parking más precisos.
          </p>
        </div>

        <p className="text-xs text-gray-400 italic flex items-center gap-1">
          <span className="text-yellow-400">💡</span>
          Incluye ciudad y país para mayor precisión (ej: Calle Mayor 1, Madrid,
          España)
        </p>

        {/* Map Placeholder */}
        <div className="relative w-full h-48 bg-gray-200 rounded-xl overflow-hidden border border-gray-300 flex items-center justify-center bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-3.7038,40.4168,14,0/800x400?access_token=placeholder')] bg-cover bg-center opacity-80">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-xs font-bold text-gray-600 flex items-center gap-2 border border-gray-200">
            <MapPin className="w-3 h-3" />
            ARRASTRA EL PIN PARA AJUSTAR PRECISIÓN
          </div>
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button className="w-8 h-8 bg-white rounded shadow text-gray-600 flex items-center justify-center font-bold">
              +
            </button>
            <button className="w-8 h-8 bg-white rounded shadow text-gray-600 flex items-center justify-center font-bold">
              -
            </button>
          </div>
        </div>

        {/* Verified Badge */}
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">
              Ubicación Verificada
            </p>
            <p className="text-xs text-green-700">
              La dirección parece correcta.
            </p>
          </div>
        </div>

        {/* Directions Content */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-teal-600" />
            <span className="text-xs font-bold text-gray-600">Cómo Llegar</span>
            <span className="text-[10px] text-gray-400 italic">
              Generado con IA
            </span>
          </div>

          <div className="p-4 space-y-6">
            {/* Airport */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-teal-800 font-bold text-xs uppercase tracking-wide">
                <Plane className="w-3 h-3" />
                DESDE EL AEROPUERTO
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Desde el Aeropuerto de Madrid-Barajas (MAD):
                <br />
                ✈️{' '}
                <span className="font-bold">
                  OPCIÓN A: Metro (Más económica)
                </span>{' '}
                🚇 Línea 8 (Rosa): Desde las terminales T1-T2-T3 y T4 hasta{' '}
                <span className="font-bold">Nuevos Ministerios</span>. Precio:
                4,50 € - 5 €.
                <br />
                ✈️{' '}
                <span className="font-bold">
                  OPCIÓN B: Tren (Directo a Atocha)
                </span>{' '}
                🚆 Cercanías Renfe (Líneas C-1 y C-10).
                <br />
                ✈️{' '}
                <span className="font-bold">
                  OPCIÓN C: Autobús Express (24 horas)
                </span>{' '}
                🚌 Línea 203: Conecta con O'Donnell, Cibeles y Atocha.
                <br />
                ✈️{' '}
                <span className="font-bold">
                  OPCIÓN D: Taxi/Uber (Más rápida)
                </span>{' '}
                🚕 Taxi: Tarifa fija de 33 €.
              </p>
            </div>

            {/* Train */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-teal-800 font-bold text-xs uppercase tracking-wide">
                <Train className="w-3 h-3" />
                DESDE LA ESTACIÓN DE TREN
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Desde la estación de{' '}
                <span className="font-bold">Atocha-Cercanías</span>:<br />
                🚆 <span className="font-bold">OPCIÓN A: Metro</span> Toma la
                Línea 1 (Azul) desde Atocha hasta Sol.
                <br />
                🚶 <span className="font-bold">OPCIÓN B: Caminando</span> Desde
                Atocha, camina directamente por la Calle de Atocha (20 min).
              </p>
            </div>

            {/* Car */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-teal-800 font-bold text-xs uppercase tracking-wide">
                <Car className="w-3 h-3" />
                APARCAMIENTO / COCHE
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                El estacionamiento en la zona es regulado (SER). Es necesario
                pagar para estacionar en la vía pública. Existen opciones de
                parking de pago cercanos.
              </p>
            </div>

            {/* Local Transport */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wide">
                  <Bus className="w-3 h-3" />
                  TRANSPORTE CERCANO (BUS/TAXI/METRO)
                </div>
                <button className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  <Plus className="w-3 h-3" /> Añadir
                </button>
              </div>

              <div className="space-y-2">
                {[
                {
                  type: 'METRO',
                  name: 'Sol (Líneas 1, 2, 3)',
                  time: '2 min andando'
                },
                {
                  type: 'METRO',
                  name: 'Ópera (Líneas 2, 5)',
                  time: '4 min andando'
                },
                {
                  type: 'BUS',
                  name: 'Mayor - Centro Comercial (Varias líneas)',
                  time: '2 min andando'
                }].
                map((item, i) =>
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                        {item.type}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {item.time}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-800">
            <span className="font-bold">Revisa los textos generados.</span> La
            IA puede cometer errores. Puedes editar cualquier sección pulsando
            el icono del lápiz.
          </p>
        </div>
      </div>
    </Card>);

}