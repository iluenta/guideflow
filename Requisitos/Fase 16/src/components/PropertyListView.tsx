import React from 'react';
import {
  Plus,
  Search,
  MapPin,
  Users,
  Bed,
  Bath,
  Sparkles,
  ExternalLink,
  Settings,
  Share2,
  Home } from
'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
interface PropertyListViewProps {
  onNewProperty: () => void;
  onConfigure: () => void;
}
export function PropertyListView({
  onNewProperty,
  onConfigure
}: PropertyListViewProps) {
  const properties = [
  {
    id: 1,
    name: 'Casa del Mar',
    location: 'Madrid, Spain',
    image:
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    guests: 2,
    bedrooms: 1,
    bathrooms: 1
  },
  {
    id: 2,
    name: 'aaaaaaa',
    location: 'Sin ubicación',
    image: null,
    guests: 2,
    bedrooms: 1,
    bathrooms: 1
  },
  {
    id: 3,
    name: 'veratespera',
    location: 'Vera, Spain',
    image:
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&w=800&q=80',
    guests: 4,
    bedrooms: 2,
    bathrooms: 2
  }];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-serif">
              Mis Propiedades
            </h1>
            <p className="text-text-secondary mt-1">
              Gestiona tus alojamientos y configura sus guías.
            </p>
          </div>
          <Button
            onClick={onNewProperty}
            leftIcon={<Plus className="w-4 h-4" />}>

            Añadir propiedad
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ubicación..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />

          </div>
          <Button variant="secondary" className="hidden md:flex">
            Filtros
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) =>
          <div
            key={property.id}
            className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">

              {/* Image */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {property.image ?
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :


              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Home className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Sin imagen</span>
                  </div>
              }
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-text-primary mb-1">
                  {property.name}
                </h3>
                <div className="flex items-center text-text-secondary text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {property.location}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-background rounded-lg p-2 text-center">
                    <Users className="w-4 h-4 mx-auto mb-1 text-text-secondary" />
                    <span className="text-xs font-medium text-text-primary">
                      {property.guests} Huéspedes
                    </span>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <Bed className="w-4 h-4 mx-auto mb-1 text-text-secondary" />
                    <span className="text-xs font-medium text-text-primary">
                      {property.bedrooms} Hab.
                    </span>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <Bath className="w-4 h-4 mx-auto mb-1 text-text-secondary" />
                    <span className="text-xs font-medium text-text-primary">
                      {property.bathrooms} Baños
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}>

                      Auto-Build
                    </Button>
                    <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs bg-[#C05621] hover:bg-[#9C4221] border-transparent"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>

                      Ver Guía
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                    onClick={onConfigure}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    leftIcon={<Settings className="w-3.5 h-3.5" />}>

                      Configurar
                    </Button>
                    <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}>

                      Compartir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

}