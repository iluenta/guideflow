"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MapPin,
  Bed,
  Bath,
  Users,
  Edit,
  Trash2,
  ExternalLink,
  MoreVertical,
  Copy,
  Globe,
  Palette,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

const properties = [
  {
    id: 1,
    name: "Apartamento Centro Madrid",
    location: "Madrid, Centro",
    status: "active",
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    pricePerNight: 85,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    guideUrl: "/guide/demo",
    landingSlug: "apartamento-centro-madrid",
    landingEnabled: true,
  },
  {
    id: 2,
    name: "Casa Rural Asturias",
    location: "Ribadesella, Asturias",
    status: "active",
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    pricePerNight: 120,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad93d0e2?w=400&h=300&fit=crop",
    guideUrl: "/guide/demo",
    landingSlug: "casa-rural-asturias",
    landingEnabled: true,
  },
  {
    id: 3,
    name: "Estudio Playa Valencia",
    location: "Valencia, Malvarrosa",
    status: "active",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 65,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    guideUrl: "/guide/demo",
    landingSlug: "estudio-playa-valencia",
    landingEnabled: false,
  },
];

function PropertiesPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  const filteredProperties = properties.filter((property) =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Propiedades
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gestiona tus alojamientos turisticos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva propiedad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Anadir nueva propiedad</DialogTitle>
                <DialogDescription>
                  Completa la informacion basica de tu alojamiento
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del alojamiento</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Apartamento Centro Madrid"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicacion</Label>
                  <Input id="location" placeholder="Ej: Madrid, Centro" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Habitaciones</Label>
                    <Input id="bedrooms" type="number" defaultValue={1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Banos</Label>
                    <Input id="bathrooms" type="number" defaultValue={1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests">Huespedes</Label>
                    <Input id="guests" type="number" defaultValue={2} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio por noche (€)</Label>
                  <Input id="price" type="number" defaultValue={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu alojamiento..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => setDialogOpen(false)}>
                    Guardar propiedad
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar propiedades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Properties Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={property.image || "/placeholder.svg"}
                  alt={property.name}
                  className="h-48 w-full object-cover"
                  crossOrigin="anonymous"
                />
                <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">
                  Activo
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {property.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/properties/${property.id}/landing`}>
                          <Palette className="mr-2 h-4 w-4" />
                          Editar landing
                        </Link>
                      </DropdownMenuItem>
                      {property.landingEnabled && (
                        <DropdownMenuItem asChild>
                          <Link href={`/p/${property.landingSlug}`} target="_blank">
                            <Globe className="mr-2 h-4 w-4" />
                            Ver landing publica
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.bedrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {property.maxGuests}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-semibold text-foreground">
                    €{property.pricePerNight}
                    <span className="text-sm font-normal text-muted-foreground">
                      /noche
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/properties/${property.id}/landing`}>
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Palette className="h-3 w-3" />
                        Landing
                      </Button>
                    </Link>
                    <Link href={property.guideUrl}>
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <ExternalLink className="h-3 w-3" />
                        Guia
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProperties.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron propiedades
            </p>
          </Card>
        )}
      </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PropertiesPageContent />
    </Suspense>
  );
}
