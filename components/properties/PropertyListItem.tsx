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
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        sizes="80px"
                        quality={60}
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <MapPin className="h-6 w-6" />
                    </div>
                )}
            </div>

            {/* ── Info Principal ────────────────────────────────── */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-900 truncate text-base group-hover:text-[#316263] transition-colors">
                        {property.name}
                    </h3>
                    <div className="hidden sm:block">
                        <StatusBadge status={currentStatus} />
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{property.city || 'Sin ciudad'}</span>
                    </div>
                    
                    {/* Stats visibles solo en Desktop para mantenerlo compacto */}
                    <div className="hidden md:flex items-center gap-3 border-l border-slate-100 pl-3">
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{property.guests}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">|</div>
                        <div className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            <span>{property.beds}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:border-l md:border-slate-100 md:pl-3">
                        <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={cn("h-full rounded-full bg-[#316263]", completion === 100 && "bg-emerald-500")}
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <span className={cn("font-medium", completion === 100 ? "text-emerald-600" : "text-[#316263]")}>
                            {completion}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Acciones ─────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <div className="sm:hidden">
                    <StatusBadge status={currentStatus} />
                </div>
                
                <Button 
                    variant="outline"
                    size="icon" 
                    className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 hover:bg-[#316263]/5 hover:text-[#316263] hover:border-[#316263]/20"
                    asChild
                >
                    <Link href={`/dashboard/properties/${property.id}/setup`}>
                        <Edit2 className="h-4 w-4" />
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-900"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 shadow-lg border-slate-100">
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
