'use client'

import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, MapPin, Clock, Star, Utensils, ShoppingBag, Landmark, Trees, Music, Coffee, Pizza, Fish, Beef, Globe, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Recommendation {
    id?: string
    name: string
    type?: string
    distance?: string
    time?: string
    price_range?: string
    personal_note?: string
    category?: string
    tags?: string[]
    description?: string
    address?: string
    google_place_id?: string
    rating?: number
    opening_hours?: {
        open: string | null
        close: string | null
        always_open?: boolean
        weekday_text?: string[]
        open_now?: boolean
    }
    metadata?: {
        time?: string
        price_range?: string
        personal_note?: string
        google_place_id?: string
        tags?: string[]
        photo_url?: string
        rating_count?: number
        editorial_summary?: string
        best_time_slots?: string[]
        availability?: {
            days: string[]
            notes?: string
        }
        opening_hours?: {
            open: string | null
            close: string | null
            always_open?: boolean
            weekday_text?: string[]
            open_now?: boolean
        }
    }
}

interface RecommendationCardProps {
    recommendation: Recommendation
    onDelete?: () => void
    onClick?: () => void
    className?: string
}

const categoryIcons: Record<string, any> = {
    'restaurantes': Utensils,
    'italiano': Pizza,
    'mediterraneo': Fish,
    'hamburguesas': Beef,
    'asiatico': UtensilsCrossed,
    'alta_cocina': Star,
    'internacional': Globe,
    'desayuno': Coffee,
    'compras': ShoppingBag,
    'cultura': Landmark,
    'naturaleza': Trees,
    'ocio': Music,
    'relax': Coffee,
    'todos': Star
}

const categoryColors: Record<string, string> = {
    'restaurantes': 'bg-orange-100 text-orange-700 border-orange-200',
    'italiano': 'bg-red-100 text-red-700 border-red-200',
    'mediterraneo': 'bg-sky-100 text-sky-700 border-sky-200',
    'hamburguesas': 'bg-amber-100 text-amber-700 border-amber-200',
    'asiatico': 'bg-rose-100 text-rose-700 border-rose-200',
    'alta_cocina': 'bg-violet-100 text-violet-700 border-violet-200',
    'internacional': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'desayuno': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'compras': 'bg-blue-100 text-blue-700 border-blue-200',
    'cultura': 'bg-amber-100 text-amber-700 border-amber-200',
    'naturaleza': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'ocio': 'bg-purple-100 text-purple-700 border-purple-200',
    'relax': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'todos': 'bg-slate-100 text-slate-700 border-slate-200'
}

export function RecommendationCard({ recommendation, onDelete, onClick, className }: RecommendationCardProps) {
    const category = (recommendation.category || recommendation.type || 'restaurantes').toLowerCase()
    const Icon = categoryIcons[category] || Star
    const colorClass = categoryColors[category] || categoryColors.todos

    const timeStr = recommendation.time || recommendation.metadata?.time
    const openingHours = (recommendation as any).metadata?.opening_hours || (recommendation as any).opening_hours
    const photoUrl = recommendation.metadata?.photo_url || (recommendation as any).photo_url
    const rating = recommendation.rating || (recommendation.metadata as any)?.rating
    const ratingCount = recommendation.metadata?.rating_count || (recommendation.metadata as any)?.user_ratings_total
    const openNow = openingHours?.open_now

    return (
        <Card
            className={cn(
                "relative group overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white rounded-xl flex flex-col",
                className
            )}
            onClick={onClick}
        >
            {/* Top Bar / Accent */}
            <div className={cn("h-1 w-full", colorClass.split(' ')[0])} />

            <div className="flex">
                {/* Left side: Photo (Optional) */}
                {photoUrl && (
                    <div className="relative w-24 sm:w-28 shrink-0 bg-slate-50 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element -- contenedor sin altura fija; la altura la define el contenido adyacente */}
                        <img
                            src={photoUrl}
                            alt={recommendation.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {openNow !== undefined && (
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
                                <div className={cn("w-1 h-1 rounded-full", openNow ? "bg-emerald-400" : "bg-rose-400")} />
                                <span className="text-[7px] font-black text-white uppercase tracking-wider">
                                    {openNow ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Right side: Content */}
                <div className="flex-1 min-w-0">
                    <CardHeader className="p-3 pb-1">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex gap-2 items-center min-w-0">
                                {!photoUrl && (
                                    <div className={cn("p-2 rounded-xl shrink-0 shadow-sm", colorClass)}>
                                        <Icon className="w-5 h-5 opacity-80" />
                                    </div>
                                )}
                                <div className="space-y-0 text-left min-w-0">
                                    <CardTitle className="text-[13px] font-bold leading-tight line-clamp-2 text-slate-900 h-[32px]">
                                        {recommendation.name}
                                    </CardTitle>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{category}</p>
                                </div>
                            </div>
                            
                            {rating && (
                                <div className="flex flex-col items-end shrink-0 pt-0.5">
                                    <div className="flex items-center gap-0.5 text-orange-400">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        <span className="text-[10px] font-black text-slate-700">{rating}</span>
                                    </div>
                                    {ratingCount && (
                                        <span className="text-[7px] text-slate-300 font-bold">
                                            ({ratingCount > 1000 ? `${(ratingCount/1000).toFixed(1)}k` : ratingCount})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-3 pt-1">
                        <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-500 mb-1.5 font-bold uppercase tracking-tight">
                            {recommendation.distance && !recommendation.distance.toLowerCase().includes('distance') && (
                                <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                    <MapPin className="w-2 h-2" />
                                    {recommendation.distance}
                                </div>
                            )}
                            {(openingHours || timeStr) && (
                                <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                    <Clock className="w-2 h-2" />
                                    <span>
                                        {openingHours?.always_open ? '24H' : (timeStr || 'OPEN')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {recommendation.description && (
                            <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-3 italic font-medium text-left mt-1">
                                {recommendation.metadata?.editorial_summary || recommendation.description}
                            </p>
                        )}
                    </CardContent>
                </div>
            </div>

            {onDelete && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-1 right-1 sm:opacity-0 sm:group-hover:opacity-100 text-slate-200 hover:text-rose-500 h-7 w-7 transition-all"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            )}
        </Card>
    )
}
