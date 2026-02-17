import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Camera, ListChecks, Upload, Check } from 'lucide-react';
import { motion } from 'framer-motion';
interface TuCasaData {
  inventoryMode: 'photo' | 'manual';
  inventoryItems: string[];
}
interface TuCasaStepProps {
  data: TuCasaData;
  onChange: (data: Partial<TuCasaData>) => void;
}
export function TuCasaStep({ data, onChange }: TuCasaStepProps) {
  const items = [
  {
    id: 'kitchen',
    label: 'Cocina completa',
    icon: '🍳'
  },
  {
    id: 'washer',
    label: 'Lavadora',
    icon: '🧺'
  },
  {
    id: 'dryer',
    label: 'Secadora',
    icon: '💨'
  },
  {
    id: 'dishwasher',
    label: 'Lavavajillas',
    icon: '🍽️'
  },
  {
    id: 'microwave',
    label: 'Microondas',
    icon: '🍕'
  },
  {
    id: 'oven',
    label: 'Horno',
    icon: '🥘'
  },
  {
    id: 'tv',
    label: 'TV',
    icon: '📺'
  },
  {
    id: 'wifi',
    label: 'WiFi',
    icon: '📶'
  },
  {
    id: 'ac',
    label: 'Aire Acond.',
    icon: '❄️'
  },
  {
    id: 'heating',
    label: 'Calefacción',
    icon: '🔥'
  },
  {
    id: 'balcony',
    label: 'Terraza/Balcón',
    icon: '☀️'
  },
  {
    id: 'parking',
    label: 'Parking',
    icon: '🚗'
  },
  {
    id: 'pool',
    label: 'Piscina',
    icon: '🏊'
  },
  {
    id: 'elevator',
    label: 'Ascensor',
    icon: '🛗'
  },
  {
    id: 'iron',
    label: 'Plancha',
    icon: '👕'
  },
  {
    id: 'hairdryer',
    label: 'Secador',
    icon: '💇'
  },
  {
    id: 'towels',
    label: 'Toallas',
    icon: '🧖'
  },
  {
    id: 'linens',
    label: 'Ropa de cama',
    icon: '🛏️'
  }];

  const toggleItem = (id: string) => {
    const newItems = data.inventoryItems.includes(id) ?
    data.inventoryItems.filter((i) => i !== id) :
    [...data.inventoryItems, id];
    onChange({
      inventoryItems: newItems
    });
  };
  return (
    <Card
      title="Tu Casa"
      description="Cuéntanos qué encontrarán tus huéspedes.">

      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() =>
            onChange({
              inventoryMode: 'photo'
            })
            }
            className={`p-4 rounded-xl border-2 text-left transition-all ${data.inventoryMode === 'photo' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}>

            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-full ${data.inventoryMode === 'photo' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>

                <Camera className="w-5 h-5" />
              </div>
              <span
                className={`font-semibold ${data.inventoryMode === 'photo' ? 'text-primary' : 'text-gray-700'}`}>

                Subir Fotos
              </span>
            </div>
            <p className="text-sm text-text-secondary pl-[52px]">
              La IA detectará el inventario automáticamente
            </p>
          </button>

          <button
            onClick={() =>
            onChange({
              inventoryMode: 'manual'
            })
            }
            className={`p-4 rounded-xl border-2 text-left transition-all ${data.inventoryMode === 'manual' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}>

            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-full ${data.inventoryMode === 'manual' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>

                <ListChecks className="w-5 h-5" />
              </div>
              <span
                className={`font-semibold ${data.inventoryMode === 'manual' ? 'text-primary' : 'text-gray-700'}`}>

                Lista Rápida
              </span>
            </div>
            <p className="text-sm text-text-secondary pl-[52px]">
              Selecciona manualmente lo que tiene tu casa
            </p>
          </button>
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {data.inventoryMode === 'photo' ?
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-medium text-text-primary mb-1">
                Arrastra fotos o haz clic
              </h4>
              <p className="text-sm text-text-secondary">
                Sube fotos de cada habitación
              </p>
            </div> :

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((item) => {
              const isSelected = data.inventoryItems.includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  whileTap={{
                    scale: 0.98
                  }}
                  onClick={() => toggleItem(item.id)}
                  className={`
                      flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-all text-left
                      ${isSelected ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-200 hover:border-gray-300 text-text-secondary hover:bg-gray-50'}
                    `}>

                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </motion.button>);

            })}
            </div>
          }
        </div>

        <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-lg flex items-start gap-3">
          <span className="text-lg">💡</span>
          <p>
            Sube los manuales de tus electrodomésticos después para generar
            instrucciones automáticas.
          </p>
        </div>
      </div>
    </Card>);

}