'use client'

import { Property, updatePropertyStatus } from '@/app/actions/properties'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bed, Bath, Share2, Edit2, MoreHorizontal, FileEdit, Archive, Globe, Loader2, UserPlus, Building2 } from 'lucide-react'
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

interface PropertyListItemProps {
    property: Property & {
        status?: 'active' | 'draft' | 'archived'
        guide_completion?: number
    }
    onStatusChange?: (id: string, newStatus: 'active' | 'draft' | 'archived') => void
}

export function PropertyListItem({ property, onStatusChange }: PropertyListItemProps) {
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
        <div className="group bg-white rounded-[20px] border border-landing-rule-soft shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_-8px_rgba(30,58,138,0.1)] transition-all duration-300 flex items-center gap-5 p-3 pr-6">

            {/* Thumbnail */}
            <div className="relative h-[80px] w-[100px] shrink-0 rounded-2xl overflow-hidden bg-landing-bg-deep shadow-inner m-0.5">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        sizes="120px"
                        quality={60}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-landing-ink-mute/30" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-bold text-landing-navy truncate text-[16px] group-hover:text-landing-mint-deep transition-colors">
                        {property.name}
                    </h3>
                    <StatusBadge status={currentStatus} className="scale-90 origin-left" />
                </div>

                <div className="flex items-center gap-1 text-xs text-landing-ink-soft mb-2.5 font-medium">
                    <MapPin className="h-3 w-3 text-landing-ink-mute" />
                    <span className="truncate">{property.city ? `${property.city}, ${property.country || 'ES'}` : 'Sin ubicación'}</span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-[11px] text-landing-ink font-bold">
                        <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-landing-ink-mute" />
                            {property.guests}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Bed className="h-3.5 w-3.5 text-landing-ink-mute" />
                            {property.beds}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Bath className="h-3.5 w-3.5 text-landing-ink-mute" />
                            {property.baths}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 bg-landing-bg-deep rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    completion === 100 ? "bg-landing-mint-deep" : "bg-landing-navy"
                                )}
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <span className={cn(
                            "text-[10px] font-jetbrains font-bold",
                            completion === 100 ? "text-landing-mint-deep" : "text-landing-navy"
                        )}>
                            {completion}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
                <Button
                    className="h-10 px-5 bg-landing-navy text-white hover:bg-landing-navy-deep rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-landing-navy/10 active:scale-95"
                    asChild
                >
                    <Link href={`/dashboard/properties/${property.id}/setup`}>
                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                        <span className="hidden sm:inline">Gestionar</span>
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 w-10 p-0 border-landing-rule-soft text-landing-ink-soft hover:bg-landing-bg-deep rounded-xl transition-all"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
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
