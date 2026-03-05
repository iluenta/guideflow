'use client'

import { Property, updatePropertyStatus } from '@/app/actions/properties'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bed, Bath, Share2, Edit2, MoreHorizontal, FileEdit, Archive, Globe, Loader2, UserPlus } from 'lucide-react'
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

interface PropertyCardProps {
    property: Property & {
        status?: 'active' | 'draft' | 'archived'
        guide_completion?: number
    }
}

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null
    const map = {
        active: { label: 'Activa', cls: 'bg-emerald-100 text-emerald-700 border-none' },
        draft: { label: 'Borrador', cls: 'bg-amber-100 text-amber-800 border-none' },
        archived: { label: 'Archivada', cls: 'bg-slate-100 text-slate-600 border-none' },
    }
    const s = map[status as keyof typeof map]
    if (!s) return null
    return (
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold shadow-sm', s.cls)}>
            {s.label}
        </span>
    )
}

export function PropertyCard({ property }: PropertyCardProps) {
    const router = useRouter()
    const [isUpdating, setIsUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(property.status || 'draft')

    // Siempre mostramos la barra — 0 si no hay dato todavía
    const completion = property.guide_completion ?? 0

    const handleStatusChange = async (newStatus: 'active' | 'draft' | 'archived') => {
        try {
            setIsUpdating(true)
            await updatePropertyStatus(property.id, newStatus)
            setCurrentStatus(newStatus)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all duration-300 flex flex-col">

            {/* ── Imagen ───────────────────────────────────────── */}
            <div className="relative aspect-video overflow-hidden">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">Sin imagen</span>
                    </div>
                )}
                {currentStatus && (
                    <div className="absolute top-3 right-3">
                        <StatusBadge status={currentStatus} />
                    </div>
                )}
            </div>

            {/* ── Nombre y ubicación ───────────────────────────── */}
            <div className="px-5 pt-4 pb-0">
                <h3 className="font-bold text-[17px] line-clamp-1 text-slate-900 group-hover:text-[#316263] transition-colors">
                    {property.name}
                </h3>
                <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">
                        {property.city
                            ? `${property.city}${property.country ? `, ${property.country}` : ''}`
                            : 'Sin ubicación'}
                    </span>
                </div>
            </div>

            {/* ── Stats ────────────────────────────────────────── */}
            <div className="px-5 pt-4">
                <div className="grid grid-cols-3 gap-0 border-y border-slate-100 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                        <Users className="h-4 w-4 text-slate-300 mb-0.5" />
                        <span className="text-sm font-semibold text-slate-700">{property.guests}</span>
                        <span className="text-[11px] text-slate-400">Huéspedes</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 border-x border-slate-100">
                        <Bed className="h-4 w-4 text-slate-300 mb-0.5" />
                        <span className="text-sm font-semibold text-slate-700">{property.beds}</span>
                        <span className="text-[11px] text-slate-400">Habitaciones</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <Bath className="h-4 w-4 text-slate-300 mb-0.5" />
                        <span className="text-sm font-semibold text-slate-700">{property.baths}</span>
                        <span className="text-[11px] text-slate-400">Baños</span>
                    </div>
                </div>
            </div>

            {/* ── Barra de progreso ─────────────────────────────── */}
            <div className="px-5 pt-4">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Guía completada</span>
                    <span className={cn(
                        "text-[11px] font-bold",
                        completion === 100 ? "text-emerald-600" : "text-[#316263]"
                    )}>
                        {completion}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-700",
                            completion === 100 ? "bg-emerald-500" : "bg-[#316263]"
                        )}
                        style={{ width: `${completion}%` }}
                    />
                </div>
            </div>

            {/* ── Botones ───────────────────────────────────────── */}
            <div className="px-5 py-4 mt-auto flex gap-2 border-t border-slate-50">
                <Button
                    className="flex-1 gap-2 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium"
                    asChild
                >
                    <Link href={`/dashboard/properties/${property.id}/setup`}>
                        <Edit2 className="h-4 w-4" />
                        Editar
                    </Link>
                </Button>

                {/* Dropdown Menu para acciones extra */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 text-slate-500 hover:text-slate-900 rounded-xl border-slate-200 hover:bg-slate-50 shrink-0"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-xl border-slate-100 bg-white" sideOffset={8}>
                        {/* Compartir solo si es activa */}
                        {currentStatus === 'active' && (
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-slate-700 py-2.5 px-3 focus:bg-slate-50 hover:bg-slate-50 transition-colors">
                                <Link href={`/${property.slug || property.id}`} target="_blank" className="flex items-center w-full">
                                    <Share2 className="mr-2.5 h-4 w-4 text-[#316263]" />
                                    <span className="font-medium">Ver guía pública</span>
                                </Link>
                            </DropdownMenuItem>
                        )}

                        {currentStatus === 'active' && (
                            <GuestAccessDialog propertyId={property.id} propertyName={property.name}>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-slate-50 hover:bg-slate-50 data-[state=open]:bg-slate-50 transition-colors flex items-center text-slate-700 focus:text-slate-900 data-[highlighted]:text-slate-900"
                                >
                                    <UserPlus className="mr-2.5 h-4 w-4 text-blue-600" />
                                    <span className="font-medium">Compartir con huésped</span>
                                </DropdownMenuItem>
                            </GuestAccessDialog>
                        )}

                        <DropdownMenuSeparator className="bg-slate-100 my-1" />

                        {currentStatus !== 'active' && (
                            <DropdownMenuItem
                                onClick={() => handleStatusChange('active')}
                                className="rounded-xl cursor-pointer text-slate-700 py-2.5 px-3 focus:bg-slate-50 transition-colors flex items-center"
                            >
                                <Globe className="mr-2.5 h-4 w-4 text-emerald-600" />
                                <span className="font-medium">Activar propiedad</span>
                            </DropdownMenuItem>
                        )}

                        {currentStatus !== 'draft' && (
                            <DropdownMenuItem
                                onClick={() => handleStatusChange('draft')}
                                className="rounded-xl cursor-pointer text-slate-700 py-2.5 px-3 focus:bg-slate-50 transition-colors flex items-center"
                            >
                                <FileEdit className="mr-2.5 h-4 w-4 text-amber-600" />
                                <span className="font-medium">Pasar a Borrador</span>
                            </DropdownMenuItem>
                        )}

                        {currentStatus !== 'archived' && (
                            <DropdownMenuItem
                                onClick={() => handleStatusChange('archived')}
                                className="rounded-xl cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 py-2.5 px-3 mt-0.5 transition-colors flex items-center"
                            >
                                <Archive className="mr-2.5 h-4 w-4" />
                                <span className="font-medium">Archivar propiedad</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}