'use client'

import { Property } from '@/app/actions/properties'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bed, Bath, Sparkles, ExternalLink, Share2 } from 'lucide-react'
import { AutoBuildDialog } from './AutoBuildDialog'
import { GuestAccessDialog } from './GuestAccessDialog'
import Link from 'next/link'
import Image from 'next/image'

interface PropertyCardProps {
    property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200 bg-white">
            {/* Imagen */}
            <div className="relative aspect-video overflow-hidden">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">Sin imagen</span>
                    </div>
                )}
            </div>

            {/* Nombre y ubicación */}
            <CardHeader className="p-4 pb-0">
                <h3 className="font-semibold text-lg line-clamp-1 text-slate-900 group-hover:text-primary transition-colors">
                    {property.name}
                </h3>
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">
                        {property.city
                            ? `${property.city}${property.country ? `, ${property.country}` : ''}`
                            : 'Sin ubicación'}
                    </span>
                </div>
            </CardHeader>

            {/* Stats */}
            <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Users className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-semibold text-slate-700">{property.guests} Huéspedes</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Bed className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-semibold text-slate-700">{property.beds} Hab.</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Bath className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-semibold text-slate-700">{property.baths} Baños</span>
                    </div>
                </div>
            </CardContent>

            {/* Botones */}
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                    <AutoBuildDialog
                        propertyId={property.id}
                        onComplete={() => { }}
                    />
                    <Button variant="secondary" className="gap-2 text-xs bg-[#316263] hover:bg-[#316263]/90 text-white" asChild>
                        <Link href={`/${property.slug || property.id}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver Guía
                        </Link>
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" className="gap-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-9" asChild>
                        <Link href={`/dashboard/properties/${property.id}/setup`}>
                            <Sparkles className="h-3.5 w-3.5" />
                            Configurar
                        </Link>
                    </Button>
                    <GuestAccessDialog
                        propertyId={property.id}
                        propertyName={property.name}
                    />
                </div>
            </CardFooter>
        </Card>
    )
}