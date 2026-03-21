'use client'

import { useState, useEffect } from 'react'
import { getProperties, Property } from '@/app/actions/properties'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyListItem } from '@/components/properties/PropertyListItem'
import { Button } from '@/components/ui/button'
import { Plus, Search, LayoutGrid, List, Building2, PlusCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const FILTERS = ['Todas', 'Activas', 'Borradores', 'Archivadas'] as const
type Filter = typeof FILTERS[number]

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('Todas')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    try {
      setLoading(true)
      const data = await getProperties()
      setProperties(data)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdateLocal = (id: string, newStatus: 'active' | 'draft' | 'archived') => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }

  const filtered = properties.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.full_address || '').toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      activeFilter === 'Todas' ? true :
        activeFilter === 'Activas' ? p.status === 'active' :
          activeFilter === 'Borradores' ? p.status === 'draft' :
            activeFilter === 'Archivadas' ? p.status === 'archived' :
              true

    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis Propiedades</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestiona tus alojamientos y sus guías digitales.</p>
        </div>
        <Button asChild className="h-10 px-5 gap-2 bg-[#316263] hover:bg-[#316263]/90 text-white shadow-md shadow-[#316263]/20 rounded-xl">
          <Link href="/dashboard/properties/new">
            <Plus className="h-4 w-4" />
            Nueva Propiedad
          </Link>
        </Button>
      </div>

      {/* Filters toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-col md:flex-row items-center justify-between gap-3">

        {/* Filtros de estado */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                activeFilter === filter
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Buscador + toggle vista */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar propiedad..."
              className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-[#316263]/20"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200" />

          {/* Toggle grid / lista */}
          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'grid'
                  ? "bg-white shadow-sm text-[#316263]"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'list'
                  ? "bg-white shadow-sm text-[#316263]"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid / Lista */}
      {loading ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[1, 2, 3, 4].map(i => (
            viewMode === 'grid' ? (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div key={i} className="flex items-center p-4 gap-4 bg-white rounded-xl border border-slate-100">
                <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            )
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid'
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        )}>
          {filtered.map((property, index) => (
            viewMode === 'grid' ? (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onStatusChange={handleStatusUpdateLocal}
                priority={index < 3}
              />
            ) : (
              <PropertyListItem
                key={property.id}
                property={property}
                onStatusChange={handleStatusUpdateLocal}
              />
            )
          ))}

          {/* Card añadir nueva propiedad */}
          <Link
            href="/dashboard/properties/new"
            className={cn(
              "group border-2 border-dashed border-slate-200 hover:border-[#316263]/40 hover:bg-[#316263]/5 transition-all flex items-center justify-center",
              viewMode === 'grid' 
                ? "flex-col rounded-2xl min-h-[280px]" 
                : "flex-row rounded-xl p-4 gap-4 h-24"
            )}
          >
            <div className={cn(
              "rounded-full bg-slate-100 group-hover:bg-[#316263]/10 flex items-center justify-center transition-colors",
              viewMode === 'grid' ? "h-14 w-14 mb-3" : "h-12 w-12"
            )}>
              {viewMode === 'grid' ? (
                <Plus className="h-7 w-7 text-slate-400 group-hover:text-[#316263]" />
              ) : (
                <PlusCircle className="h-6 w-6 text-slate-400 group-hover:text-[#316263]" />
              )}
            </div>
            <div className={cn(viewMode === 'list' && "flex-1")}>
              <h3 className="text-base font-bold text-slate-700 group-hover:text-[#316263]">Añadir Propiedad</h3>
              <p className="text-sm text-slate-400 mt-1">Configura un nuevo alojamiento</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="h-16 w-16 bg-[#316263]/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-[#316263]" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No se encontraron propiedades</h2>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs">
            {search ? 'Intenta con otros términos.' : 'Aún no has añadido ninguna propiedad.'}
          </p>
          {!search && (
            <Button asChild className="mt-5 bg-[#316263] hover:bg-[#316263]/90 text-white rounded-xl">
              <Link href="/dashboard/properties/new">Añadir mi primera propiedad</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}