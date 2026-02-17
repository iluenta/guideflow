import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import {
  MapPin,
  ArrowRight,
  Utensils,
  ShoppingCart,
  Pill,
  Bus,
  Palmtree,
  Sparkles } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
interface RecomendacionesData {
  hasRecommendations: boolean | null;
  selectedPlaces: string[];
}
interface RecomendacionesStepProps {
  data: RecomendacionesData;
  onChange: (data: Partial<RecomendacionesData>) => void;
}
export function RecomendacionesStep({
  data,
  onChange
}: RecomendacionesStepProps) {
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const places = [
  {
    id: 'rest1',
    name: 'La Taberna del Puerto',
    category: 'Restaurantes',
    icon: Utensils
  },
  {
    id: 'shop1',
    name: 'Mercadona',
    category: 'Supermercados',
    icon: ShoppingCart
  },
  {
    id: 'pharm1',
    name: 'Farmacia Central',
    category: 'Farmacia',
    icon: Pill
  },
  {
    id: 'bus1',
    name: 'Parada Línea 5',
    category: 'Transporte',
    icon: Bus
  },
  {
    id: 'beach1',
    name: 'Playa Mayor',
    category: 'Playa/Ocio',
    icon: Palmtree
  }];

  const handleStartAI = () => {
    setIsSimulatingAI(true);
    setTimeout(() => {
      setIsSimulatingAI(false);
      onChange({
        hasRecommendations: true,
        selectedPlaces: places.map((p) => p.id)
      });
    }, 2000);
  };
  const togglePlace = (id: string) => {
    const newPlaces = data.selectedPlaces.includes(id) ?
    data.selectedPlaces.filter((p) => p !== id) :
    [...data.selectedPlaces, id];
    onChange({
      selectedPlaces: newPlaces
    });
  };
  if (data.hasRecommendations === null && !isSimulatingAI) {
    return (
      <Card
        title="¿Primera vez aquí?"
        description="Ayuda a tus huéspedes a descubrir la zona.">

        <div className="space-y-4 py-4">
          <button
            onClick={handleStartAI}
            className="w-full p-6 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group text-left flex items-center justify-between">

            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-white rounded-full">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary">
                  Sí, sugiere sitios por mi ubicación
                </h3>
                <p className="text-text-secondary">
                  La IA encontrará los mejores lugares cerca
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() =>
            onChange({
              hasRecommendations: false
            })
            }
            className="w-full p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group text-left flex items-center justify-between">

            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary">
                  No, los añadiré después
                </h3>
                <p className="text-text-secondary">
                  Prefiero hacerlo manualmente más tarde
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </Card>);

  }
  if (isSimulatingAI) {
    return (
      <Card
        title="Analizando la zona..."
        description="Buscando los mejores lugares cercanos.">

        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-text-secondary animate-pulse">
            Consultando mapas locales...
          </p>
        </div>
      </Card>);

  }
  return (
    <Card
      title="Sitios Sugeridos"
      description="Hemos encontrado estos lugares populares cerca de ti.">

      <div className="space-y-3">
        {places.map((place, index) => {
          const isSelected = data.selectedPlaces.includes(place.id);
          const Icon = place.icon;
          return (
            <motion.div
              key={place.id}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: index * 0.1
              }}
              className={`
                flex items-center justify-between p-4 rounded-lg border transition-all
                ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 opacity-60'}
              `}>

              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>

                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-500'}`}>

                    {place.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">
                      {place.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      Sugerido por IA
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlace(place.id)}
                  className="w-6 h-6 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />

              </div>
            </motion.div>);

        })}
        <Button
          variant="ghost"
          className="w-full mt-4 text-text-secondary"
          onClick={() =>
          onChange({
            hasRecommendations: false
          })
          }>

          Volver a selección
        </Button>
      </div>
    </Card>);

}