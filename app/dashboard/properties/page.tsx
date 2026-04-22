'use client'

import { useState, useEffect } from 'react'
import { getProperties, Property } from '@/app/actions/properties'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyListItem } from '@/components/properties/PropertyListItem'
import { Button } from '@/components/ui/button'
import { Plus, Search, LayoutGrid, List, Building2, PlusCircle, ArrowRight } from 'lucide-react'
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
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-landing-mint-deep shadow-[0_0_0_4px_rgba(45,212,191,0.2)]"></div>
            <span className="font-jetbrains text-[11px] tracking-[0.15em] uppercase text-landing-ink-mute">Propiedades</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-landing-navy sm:text-5xl">
            Gestionar <span className="text-landing-mint-deep">Alojamientos</span>
          </h1>
          <p className="mt-2 text-landing-ink-soft max-w-[520px]">
            Organiza tus propiedades, edita guías digitales y controla el acceso de tus huéspedes.
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button className="bg-landing-navy text-white rounded-full h-12 px-8 hover:bg-landing-navy-deep transition-all shadow-lg shadow-landing-navy/20 active:scale-95">
            <Plus className="h-4 w-4 mr-2" />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-landing-rule-soft rounded-[24px] p-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Tabs */}
        <div className="flex items-center gap-1 w-full md:w-auto p-1 overflow-x-auto scrollbar-hide">
          {FILTERS.map(filter => {
            const count =
              filter === 'Todas' ? properties.length :
              filter === 'Activas' ? properties.filter(p => p.status === 'active').length :
              filter === 'Borradores' ? properties.filter(p => p.status === 'draft').length :
              properties.filter(p => p.status === 'archived').length
            
            const isActive = activeFilter === filter

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2.5",
                  isActive
                    ? "bg-landing-navy text-white shadow-xl shadow-landing-navy/20"
                    : "text-landing-ink-soft hover:bg-landing-bg-deep hover:text-landing-ink"
                )}
              >
                {filter}
                <span className={cn(
                  "font-jetbrains text-[10px] rounded-full px-2 py-0.5 min-w-[20px] transition-colors",
                  isActive ? "bg-white/20 text-white" : "bg-landing-bg-deep text-landing-ink-soft"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tools */}
        <div className="flex items-center gap-3 w-full md:w-auto px-2">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-landing-ink-mute h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o dirección..."
              className="pl-11 h-11 bg-landing-bg-deep border-transparent rounded-full text-sm placeholder:text-landing-ink-mute focus:bg-white focus:ring-landing-navy-soft/20 focus:border-landing-navy-soft transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="hidden md:block h-6 w-px bg-landing-rule-soft" />

          {/* View Toggle */}
          <div className="flex items-center bg-landing-bg-deep rounded-full p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-full transition-all",
                viewMode === 'grid'
                  ? "bg-white shadow-md text-landing-navy"
                  : "text-landing-ink-mute hover:text-landing-ink-soft"
              )}
            >
              <LayoutGrid className="h-4.5 w-4.5 stroke-[2]" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-full transition-all",
                viewMode === 'list'
                  ? "bg-white shadow-md text-landing-navy"
                  : "text-landing-ink-mute hover:text-landing-ink-soft"
              )}
            >
              <List className="h-4.5 w-4.5 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={cn(
          "grid gap-8",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-landing-rule-soft rounded-[28px] p-4 space-y-4 shadow-sm animate-pulse">
              <div className="aspect-[16/10] bg-landing-bg-deep rounded-[20px]" />
              <div className="space-y-2 px-2">
                <div className="h-5 bg-landing-bg-deep rounded w-2/3" />
                <div className="h-4 bg-landing-bg-deep rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className={cn(
          "grid gap-8",
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

          {/* Add New Property CTA */}
          <Link
            href="/dashboard/properties/new"
            className={cn(
              "group border-2 border-dashed border-landing-rule-soft hover:border-landing-navy-soft/40 hover:bg-landing-navy-tint/30 transition-all flex items-center justify-center relative overflow-hidden",
              viewMode === 'grid' 
                ? "flex-col rounded-[28px] min-h-[340px]" 
                : "flex-row rounded-[20px] p-6 gap-6 h-28"
            )}
          >
            <div className={cn(
              "rounded-2xl bg-landing-bg-deep group-hover:bg-landing-navy-tint flex items-center justify-center transition-all group-hover:scale-110",
              viewMode === 'grid' ? "h-20 w-20 mb-6" : "h-16 w-16"
            )}>
              <Plus className="h-8 w-8 text-landing-ink-mute group-hover:text-landing-navy" />
            </div>
            <div className={cn(viewMode === 'grid' ? "text-center" : "flex-1")}>
              <h3 className="text-lg font-bold text-landing-navy">Añadir propiedad</h3>
              <p className="text-sm text-landing-ink-soft mt-1">Configura un nuevo alojamiento en minutos</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-landing-navy opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[32px] border-2 border-dashed border-landing-rule-soft bg-landing-bg/30">
          <div className="h-20 w-20 bg-landing-navy-tint rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <Building2 className="h-10 w-10 text-landing-navy" />
          </div>
          <h2 className="text-2xl font-bold text-landing-navy">No encontramos nada</h2>
          <p className="text-landing-ink-soft text-base mt-2 max-w-sm">
            {search ? 'Intenta con otros términos de búsqueda.' : 'Aún no has configurado ninguna propiedad en Hospyia.'}
          </p>
          {!search && (
            <Button asChild className="mt-8 h-12 px-8 bg-landing-navy text-white rounded-full hover:bg-landing-navy-deep shadow-xl shadow-landing-navy/20">
              <Link href="/dashboard/properties/new">Añadir mi primera propiedad</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}