'use client'

import { Property, updatePropertyStatus } from '@/app/actions/properties'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bed, Bath, Share2, Edit2, MoreHorizontal, FileEdit, Archive, Globe, Loader2, UserPlus, Building2, ArrowRight } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { GuestAccessDialog } from './GuestAccessDialog'
import { StatusBadge } from './StatusBadge'

interface PropertyCardProps {
    property: Property & {
        status?: 'active' | 'draft' | 'archived'
        guide_completion?: number
    }
    onStatusChange?: (id: string, newStatus: 'active' | 'draft' | 'archived') => void
    priority?: boolean
}

export function PropertyCard({ property, onStatusChange, priority = false }: PropertyCardProps) {
    const router = useRouter()
    const [isUpdating, setIsUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(property.status || 'draft')

    const completion = property.guide_completion ?? 0

    const handleStatusChange = async (newStatus: 'active' | 'draft' | 'archived') => {
        try {
            setIsUpdating(true)
            await updatePropertyStatus(property.id, newStatus)
            setCurrentStatus(newStatus)
            onStatusChange?.(property.id, newStatus)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="group bg-white rounded-[28px] overflow-hidden border border-landing-rule-soft shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(30,58,138,0.12)] transition-all duration-500 flex flex-col h-full">

            {/* Image Section */}
            <div className="relative aspect-[16/10] overflow-hidden m-3 rounded-[20px] shadow-inner">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={80}
                        priority={priority}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-landing-bg-deep flex flex-col items-center justify-center gap-2">
                        <Building2 className="h-10 w-10 text-landing-ink-mute/30" />
                        <span className="text-landing-ink-mute text-xs font-bold uppercase tracking-widest">Sin imagen</span>
                    </div>
                )}
                
                {/* Status Overlay */}
                <div className="absolute top-3 right-3">
                    <StatusBadge status={currentStatus} className="backdrop-blur-md bg-white/80" />
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pt-2 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="font-bold text-[18px] text-landing-navy group-hover:text-landing-mint-deep transition-colors line-clamp-1 mb-1">
                        {property.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-landing-ink-soft text-xs font-medium">
                        <MapPin className="h-3 w-3 text-landing-ink-mute" />
                        <span className="truncate">
                            {property.city ? `${property.city}, ${property.country || 'ES'}` : 'Sin ubicación'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between py-3 border-y border-landing-rule-soft/50 mb-4">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-landing-ink-mute" />
                        <span className="text-xs font-bold text-landing-ink">{property.guests}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4 text-landing-ink-mute" />
                        <span className="text-xs font-bold text-landing-ink">{property.beds}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4 text-landing-ink-mute" />
                        <span className="text-xs font-bold text-landing-ink">{property.baths}</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-landing-ink-mute opacity-70">Progreso de la guía</span>
                        <span className="font-jetbrains text-xs font-bold text-landing-navy">{completion}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-landing-bg-deep rounded-full overflow-hidden">
                        <div 
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                completion === 100 ? "bg-landing-mint-deep" : "bg-landing-navy"
                            )}
                            style={{ width: `${completion}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-6 pb-6 mt-auto flex gap-3">
                <Button
                    className="flex-1 h-11 bg-landing-navy text-white hover:bg-landing-navy-deep rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-landing-navy/10 active:scale-95"
                    asChild
                >
                    <Link href={`/dashboard/properties/${property.id}/setup`}>
                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                        Gestionar
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-11 w-11 p-0 border-landing-rule-soft text-landing-ink-soft hover:bg-landing-bg-deep rounded-xl transition-all"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 bg-white border border-landing-rule-soft shadow-2xl rounded-2xl mt-2">
                        {currentStatus === 'active' && (
                            <>
                                <DropdownMenuItem asChild className="rounded-xl p-2.5 focus:bg-landing-navy-tint focus:text-landing-navy cursor-pointer">
                                    <Link href={`/${property.slug || property.id}`} target="_blank" className="flex items-center gap-3">
                                        <Share2 className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-wider">Ver Guía Pública</span>
                                    </Link>
                                </DropdownMenuItem>
                                <GuestAccessDialog propertyId={property.id} propertyName={property.name}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl p-2.5 focus:bg-landing-mint-tint focus:text-landing-mint-deep cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <UserPlus className="h-4 w-4" />
                                            <span className="font-bold text-xs uppercase tracking-wider">Acceso Huésped</span>
                                        </div>
                                    </DropdownMenuItem>
                                </GuestAccessDialog>
                                <DropdownMenuSeparator className="bg-landing-rule-soft" />
                            </>
                        )}

                        <DropdownMenuItem onClick={() => handleStatusChange('active')} className="rounded-xl p-2.5 focus:bg-landing-mint-tint focus:text-landing-mint-deep cursor-pointer">
                            <Globe className="h-4 w-4 mr-3" />
                            <span className="font-bold text-xs uppercase tracking-wider">Activar</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleStatusChange('draft')} className="rounded-xl p-2.5 focus:bg-landing-amber-tint focus:text-landing-amber cursor-pointer">
                            <FileEdit className="h-4 w-4 mr-3" />
                            <span className="font-bold text-xs uppercase tracking-wider">Borrador</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-landing-rule-soft" />
                        
                        <DropdownMenuItem onClick={() => handleStatusChange('archived')} className="rounded-xl p-2.5 focus:bg-landing-rose-tint focus:text-landing-rose cursor-pointer">
                            <Archive className="h-4 w-4 mr-3" />
                            <span className="font-bold text-xs uppercase tracking-wider">Archivar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}