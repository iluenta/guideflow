import { getProperties, getGuideSections } from '@/app/actions/properties'
import { GuideManager } from '@/components/guides/GuideManager'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ExternalLink,
  MessageSquare,
  Edit,
  QrCode,
  Copy
} from 'lucide-react'
import Link from 'next/link'

export default async function GuidesPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id: selectedId } = await searchParams
  const properties = await getProperties()

  // Find the currently selected property
  const selectedProperty = selectedId
    ? properties.find(p => p.id === selectedId)
    : null

  const initialSections = selectedProperty
    ? await getGuideSections(selectedProperty.id)
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Guías del Huésped
          </h1>
          <p className="mt-1 text-muted-foreground">
            Crea y gestiona las guías con IA para tus huéspedes
          </p>
        </div>
        <Link href="/guide/demo">
          <Button variant="outline" className="gap-2 bg-transparent shadow-sm">
            <ExternalLink className="h-4 w-4" />
            Ver demo interactiva
          </Button>
        </Link>
      </div>

      {/* Selection Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const isActive = selectedProperty?.id === property.id
          return (
            <Card
              key={property.id}
              className={`transition-all duration-300 ${isActive ? 'ring-2 ring-primary shadow-lg bg-primary/5' : 'hover:shadow-md'
                }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg leading-tight truncate">
                        {property.name}
                      </h3>
                      <Badge variant={property.slug ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {property.slug ? 'Publicada' : 'Borrador'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {property.location}
                    </p>
                  </div>

                  {/* Quick Stats Mock (Will be real later) */}
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-medium">
                      IA entrenada y activa
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-[11px] gap-1 px-3"
                      asChild
                    >
                      <Link href={`/dashboard/guides?id=${property.id}`}>
                        <Edit className="h-3 w-3" />
                        Gestionar
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[11px] px-2 shadow-none">
                      <QrCode className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[11px] px-2 shadow-none">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[11px] px-3 gap-1 shadow-none" asChild>
                      <Link href={`/${property.slug}`} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                        Abrir
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {properties.length === 0 && (
          <Card className="col-span-full border-dashed py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">No tienes propiedades registradas.</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/properties">Crear mi primera propiedad</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Property Manager */}
      {selectedProperty && (
        <div className="mt-8 pt-8 border-t">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <GuideManager
                property={selectedProperty}
                initialSections={initialSections}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
