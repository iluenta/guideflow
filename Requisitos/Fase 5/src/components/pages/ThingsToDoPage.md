import React, { useState } from 'react';
import { PageHeader } from '../PageHeader';
import {
  Mountain,
  Landmark,
  Trees,
  MapPin,
  Clock,
  ArrowRight,
  Camera,
  Bike,
  Waves } from
'lucide-react';
interface ThingsToDoPageProps {
  onBack: () => void;
}
type Category = 'all' | 'nature' | 'culture' | 'relax';
interface Activity {
  id: string;
  title: string;
  description: string;
  category: Exclude<Category, 'all'>;
  distance: string;
  duration: string;
  image?: string;
  icon: React.ElementType;
  color: string;
}
const activities: Activity[] = [
{
  id: '1',
  title: 'Ruta del Mirador',
  description:
  'Sendero panorámico con vistas espectaculares al valle. Ideal para ver el atardecer.',
  category: 'nature',
  distance: '2.5 km',
  duration: '1.5h',
  icon: Mountain,
  color: 'text-emerald-600 bg-emerald-50'
},
{
  id: '2',
  title: 'Museo Etnográfico',
  description:
  'Descubre la historia y tradiciones locales en este encantador museo restaurado.',
  category: 'culture',
  distance: '500 m',
  duration: '45 min',
  icon: Landmark,
  color: 'text-amber-600 bg-amber-50'
},
{
  id: '3',
  title: 'Bosque Encantado',
  description:
  'Paseo tranquilo entre robles centenarios. Perfecto para desconectar y respirar aire puro.',
  category: 'relax',
  distance: '1.2 km',
  duration: '1h',
  icon: Trees,
  color: 'text-teal-600 bg-teal-50'
},
{
  id: '4',
  title: 'Alquiler de Bicis',
  description:
  'Recorre los caminos rurales sobre dos ruedas. Disponibles en la plaza del pueblo.',
  category: 'nature',
  distance: '300 m',
  duration: 'Flexible',
  icon: Bike,
  color: 'text-blue-600 bg-blue-50'
},
{
  id: '5',
  title: 'Plaza Mayor',
  description:
  'El corazón del pueblo. Arquitectura tradicional, terrazas y ambiente local.',
  category: 'culture',
  distance: '100 m',
  duration: '30 min',
  icon: Camera,
  color: 'text-indigo-600 bg-indigo-50'
},
{
  id: '6',
  title: 'Zona de Baño Natural',
  description:
  'Piscinas naturales formadas por el río. Agua cristalina y zonas de sombra.',
  category: 'relax',
  distance: '3 km',
  duration: 'Tarde',
  icon: Waves,
  color: 'text-cyan-600 bg-cyan-50'
}];

export function ThingsToDoPage({ onBack }: ThingsToDoPageProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const filteredActivities =
  activeCategory === 'all' ?
  activities :
  activities.filter((a) => a.category === activeCategory);
  return (
    <div className="min-h-screen bg-beige pb-8">
      <PageHeader title="Qué Hacer" onBack={onBack} />

      {/* Hero Section */}
      <div className="px-4 py-6">
        <h2 className="font-serif text-2xl text-navy font-medium leading-tight mb-2">
          Descubre el entorno
        </h2>
        <p className="text-slate text-sm">
          Experiencias únicas y rincones especiales seleccionados para ti.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-navy text-white shadow-md' : 'bg-white text-slate hover:bg-white/80'}`}>

            Todo
          </button>
          <button
            onClick={() => setActiveCategory('nature')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${activeCategory === 'nature' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate hover:bg-white/80'}`}>

            <Mountain className="w-3 h-3" />
            Naturaleza
          </button>
          <button
            onClick={() => setActiveCategory('culture')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${activeCategory === 'culture' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate hover:bg-white/80'}`}>

            <Landmark className="w-3 h-3" />
            Cultura
          </button>
          <button
            onClick={() => setActiveCategory('relax')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${activeCategory === 'relax' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate hover:bg-white/80'}`}>

            <Trees className="w-3 h-3" />
            Relax
          </button>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="px-4 space-y-4">
        {filteredActivities.map((activity) =>
        <div
          key={activity.id}
          className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group">

            <div className="flex items-start gap-4">
              {/* Icon Box */}
              <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activity.color}`}>

                <activity.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-serif text-lg text-navy font-medium leading-tight">
                    {activity.title}
                  </h3>
                </div>

                <p className="text-slate text-sm leading-relaxed mb-3 line-clamp-2">
                  {activity.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate/70">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activity.distance}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activity.duration}
                  </div>
                </div>
              </div>

              {/* Action Arrow */}
              <div className="self-center">
                <div className="w-8 h-8 rounded-full bg-beige flex items-center justify-center text-navy opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}