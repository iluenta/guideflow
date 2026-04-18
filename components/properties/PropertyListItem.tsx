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
        <div className="group bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 flex items-center gap-4 p-3 pr-4">

            {/* Thumbnail */}
            <div className="relative h-[72px] w-[96px] shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        sizes="120px"
                        quality={60}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <Building2 className="h-6 w-6 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate text-[15px] group-hover:text-[#316263] transition-colors">
                        {property.name}
                    </h3>
                    <StatusBadge status={currentStatus} />
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-400 mb-2.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{property.city ? `${property.city}${property.country ? `, ${property.country}` : ''}` : 'Sin ubicación'}</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{property.guests}</span>
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{property.beds}</span>
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{property.baths}</span>
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-700",
                                    completion === 100
                                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                        : "bg-gradient-to-r from-[#316263]/70 to-[#316263]"
                                )}
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <span className={cn(
                            "text-[11px] font-bold",
                            completion === 100 ? "text-emerald-600" : "text-[#316263]"
                        )}>
                            {completion}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    className="h-9 px-4 gap-1.5 bg-[#316263] hover:bg-[#316263]/90 text-white rounded-xl text-sm font-medium shadow-sm shadow-[#316263]/20"
                    asChild
                >
                    <Link href={`/dashboard/properties/${property.id}/setup`}>
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 shrink-0"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl shadow-slate-200/80 border border-slate-100 bg-white" sideOffset={6}>
                        {currentStatus === 'active' && (
                            <>
                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-slate-700 py-2.5 px-3 focus:bg-[#316263]/5 focus:text-[#316263] transition-colors">
                                    <Link href={`/${property.slug || property.id}`} target="_blank" className="flex items-center w-full gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-[#316263]/10 flex items-center justify-center shrink-0">
                                            <Share2 className="h-3.5 w-3.5 text-[#316263]" />
                                        </div>
                                        <span className="font-medium text-sm">Ver guía pública</span>
                                    </Link>
                                </DropdownMenuItem>
                                <GuestAccessDialog propertyId={property.id} propertyName={property.name}>
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-blue-50 transition-colors flex items-center gap-3 text-slate-700"
                                    >
                                        <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                                        </div>
                                        <span className="font-medium text-sm">Compartir con huésped</span>
                                    </DropdownMenuItem>
                                </GuestAccessDialog>
                                <DropdownMenuSeparator className="bg-slate-100 my-1.5" />
                            </>
                        )}

                        {currentStatus !== 'active' && (
                            <DropdownMenuItem
                                onClick={() => handleStatusChange('active')}
                                className="rounded-xl cursor-pointer text-slate-700 py-2.5 px-3 focus:bg-emerald-50 focus:text-emerald-700 transition-colors flex items-center gap-3"
                            >
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                                </div>
                                <span className="font-medium text-sm">Activar propiedad</span>
                            </DropdownMenuItem>
                        )}

                        {currentStatus !== 'draft' && (
                            <DropdownMenuItem
                                onClick={() => handleStatusChange('draft')}
                                className="rounded-xl cursor-pointer text-slate-700 py-2.5 px-3 focus:bg-amber-50 focus:text-amber-700 transition-colors flex items-center gap-3"
                            >
                                <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <FileEdit className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                                <span className="font-medium text-sm">Pasar a Borrador</span>
                            </DropdownMenuItem>
                        )}

                        {currentStatus !== 'archived' && (
                            <>
                                <DropdownMenuSeparator className="bg-slate-100 my-1.5" />
                                <DropdownMenuItem
                                    onClick={() => handleStatusChange('archived')}
                                    className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-red-50 transition-colors flex items-center gap-3 text-red-600 focus:text-red-700"
                                >
                                    <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                        <Archive className="h-3.5 w-3.5 text-red-500" />
                                    </div>
                                    <span className="font-medium text-sm">Archivar propiedad</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
