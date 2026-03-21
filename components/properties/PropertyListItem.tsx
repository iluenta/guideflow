'use client'

import { Property, updatePropertyStatus } from '@/app/actions/properties'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bed, Bath, Share2, Edit2, MoreHorizontal, FileEdit, Archive, Globe, Loader2, UserPlus, ExternalLink } from 'lucide-react'
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
        <div className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex items-center p-3 gap-4">
            
            {/* ── Thumbnail ───────────────────────────────────── */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        sizes="100px"
                        quality={60}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <MapPin className="h-6 w-6" />
                    </div>
                )}
            </div>

            {/* ── Info Principal ────────────────────────────────── */}
            <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate text-base sm:text-lg group-hover:text-[#316263] transition-colors">
                        {property.name}
                    </h3>
                    <div className="hidden md:block">
                        <StatusBadge status={currentStatus} />
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <StatusBadge status={currentStatus} className="md:hidden scale-90 -ml-1" />
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="truncate">{property.city || 'Sin ciudad'}</span>
                    </div>
                    
                    {/* Stats visibles en sm+ */}
                    <div className="hidden sm:flex items-center gap-3 text-slate-400">
                        <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span className="font-medium text-slate-600">{property.guests}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5" />
                            <span className="font-medium text-slate-600">{property.beds}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            <span className="font-medium text-slate-600">{property.baths}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-0">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div 
                                className={cn("h-full rounded-full bg-[#316263]", completion === 100 && "bg-emerald-500")}
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <span className={cn(
                            "font-bold text-[10px] tracking-tight uppercase", 
                            completion === 100 ? "text-emerald-700" : "text-[#316263]"
                        )}>
                            {completion}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Acciones ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 sm:gap-4 pl-2 border-l border-slate-50 sm:border-none">
                <Button 
                    variant="outline"
                    size="icon" 
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border-slate-200 text-slate-600 hover:bg-[#316263] hover:text-white hover:border-[#316263] transition-all"
                    asChild
                >
                    <Link href={`/dashboard/properties/${property.id}/setup`}>
                        <Edit2 className="h-4.5 w-4.5" />
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-6 w-6" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 shadow-lg border-slate-100 bg-white">
                        {currentStatus === 'active' && (
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                <Link href={`/${property.slug || property.id}`} target="_blank" className="flex items-center">
                                    <ExternalLink className="mr-2 h-4 w-4 text-[#316263]" />
                                    <span>Ver guía pública</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        
                        {currentStatus === 'active' && (
                            <GuestAccessDialog propertyId={property.id} propertyName={property.name}>
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="rounded-lg cursor-pointer">
                                    <UserPlus className="mr-2 h-4 w-4 text-blue-600" />
                                    <span>Compartir con huésped</span>
                                </DropdownMenuItem>
                            </GuestAccessDialog>
                        )}

                        <DropdownMenuSeparator className="bg-slate-50" />
                        
                        {currentStatus !== 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange('active')} className="rounded-lg cursor-pointer text-emerald-600">
                                <Globe className="mr-2 h-4 w-4" />
                                <span>Activar propiedad</span>
                            </DropdownMenuItem>
                        )}
                        
                        {currentStatus !== 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange('draft')} className="rounded-lg cursor-pointer text-amber-600">
                                <FileEdit className="mr-2 h-4 w-4" />
                                <span>Pasar a Borrador</span>
                            </DropdownMenuItem>
                        )}
                        
                        {currentStatus !== 'archived' && (
                            <DropdownMenuItem onClick={() => handleStatusChange('archived')} className="rounded-lg cursor-pointer text-red-600">
                                <Archive className="mr-2 h-4 w-4" />
                                <span>Archivar propiedad</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
