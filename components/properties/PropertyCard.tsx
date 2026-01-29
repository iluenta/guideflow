'use client'

import { Property } from '@/app/actions/properties'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bed, Bath, Edit2, Sparkles, ExternalLink } from 'lucide-react'
import { AutoBuildDialog } from './AutoBuildDialog'
import Link from 'next/link'
import Image from 'next/image'

interface PropertyCardProps {
    property: Property
    onEdit: (property: Property) => void
}

export function PropertyCard({ property, onEdit }: PropertyCardProps) {
    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative aspect-video overflow-hidden">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Sin imagen</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={() => onEdit(property)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <CardHeader className="p-4 pb-0">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {property.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-4">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border/50">
                        <Users className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-medium">{property.guests} Huéspedes</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border/50">
                        <Bed className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-medium">{property.beds} Hab.</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border/50">
                        <Bath className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-medium">{property.baths} Baños</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                    <AutoBuildDialog
                        propertyId={property.id}
                        onComplete={() => { }}
                    />
                    <Button variant="secondary" className="gap-2 text-xs" asChild>
                        <Link href={`/${property.slug}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver Guía
                        </Link>
                    </Button>
                </div>
                <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-9" onClick={() => onEdit(property)}>
                    Editar Detalles
                </Button>
            </CardFooter>
        </Card>
    )
}
