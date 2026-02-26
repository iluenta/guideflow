'use client'

import { useState, useEffect } from 'react'
import { getProperties, Property } from '@/app/actions/properties'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { Button } from '@/components/ui/button'
import { Plus, Search, Building2, SlidersHorizontal } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

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

  const filteredProperties = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.full_address || '').toLowerCase().includes(search.toLowerCase())
  )


  const handleAdd = () => {
    // Ya no se usa, usamos Link directamente
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Propiedades</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus alojamientos y configura sus guías.
          </p>
        </div>
        <Button asChild className="h-11 px-6 gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
          <Link href="/dashboard/properties/new">
            <Plus className="h-5 w-5" />
            Añadir propiedad
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o ubicación..."
            className="pl-9 h-10 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 h-10">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-2 border-dashed border-muted-foreground/10 bg-muted/5">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No se encontraron propiedades</h2>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
            {search ? 'Intenta con otros términos de búsqueda.' : 'Parece que aún no has añadido ninguna propiedad. ¡Empieza ahora!'}
          </p>
          {!search && (
            <Button asChild variant="secondary" className="mt-6">
              <Link href="/dashboard/properties/new">
                Añadir mi primera propiedad
              </Link>
            </Button>
          )}
        </div>
      )}

    </div>
  )
}
