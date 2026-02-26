import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PropertyCard } from '../components/PropertyCard';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
export function Properties() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('Todas');
  const properties = [
  {
    id: 1,
    title: 'Villa Sol',
    location: 'Madrid, Spain',
    image:
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
    stats: {
      guests: 4,
      bedrooms: 2,
      bathrooms: 2
    },
    rating: 4.9,
    status: 'active' as const,
    guideCompletion: 100
  },
  {
    id: 2,
    title: 'Villa Macarena',
    location: 'Madrid, Spain',
    image:
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=500&fit=crop',
    stats: {
      guests: 6,
      bedrooms: 3,
      bathrooms: 2
    },
    rating: 4.8,
    status: 'active' as const,
    guideCompletion: 85
  },
  {
    id: 3,
    title: 'Soniamar',
    location: 'Madrid, Spain',
    image:
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop',
    stats: {
      guests: 2,
      bedrooms: 1,
      bathrooms: 1
    },
    rating: 4.7,
    status: 'draft' as const,
    guideCompletion: 45
  },
  {
    id: 4,
    title: 'Casa del Rio',
    location: 'Toledo, Spain',
    image:
    'https://images.unsplash.com/photo-1600596542815-2495db9dc2c3?w=800&h=500&fit=crop',
    stats: {
      guests: 8,
      bedrooms: 4,
      bathrooms: 3
    },
    rating: 5.0,
    status: 'active' as const,
    guideCompletion: 92
  },
  {
    id: 5,
    title: 'Apartamento Centro',
    location: 'Madrid, Spain',
    image:
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
    stats: {
      guests: 2,
      bedrooms: 1,
      bathrooms: 1
    },
    rating: 4.6,
    status: 'archived' as const,
    guideCompletion: 100
  }];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-navy mb-1">
            Mis Propiedades
          </h1>
          <p className="text-gray-500">
            Gestiona tus alojamientos y sus guías digitales.
          </p>
        </div>
        <button className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Propiedad
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center w-full md:w-auto overflow-x-auto">
          {['Todas', 'Activas', 'Borradores', 'Archivadas'].map((filter) =>
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === filter ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-navy'}`}>

              {filter}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar propiedad..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />

          </div>

          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>

              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>

              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop, index) =>
        <PropertyCard key={prop.id} {...prop} delay={index * 0.1} />
        )}

        {/* Add New Card Placeholder */}
        <motion.button
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: properties.length * 0.1
          }}
          className="group border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center min-h-[400px] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">

          <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-indigo-100 flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700">
            Añadir Propiedad
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configura un nuevo alojamiento
          </p>
        </motion.button>
      </div>
    </div>);

}