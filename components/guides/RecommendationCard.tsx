'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, MapPin, Clock, Star, Utensils, ShoppingBag, Landmark, Trees, Music, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Recommendation {
    id?: string
    name: string
    type?: string
    distance?: string
    time?: string
    price_range?: string
    description?: string
    personal_note?: string
    category?: string
    metadata?: {
        time?: string
        price_range?: string
        personal_note?: string
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
    'compras': ShoppingBag,
    'cultura': Landmark,
    'naturaleza': Trees,
    'ocio': Music,
    'relax': Coffee,
    'todos': Star
}

const categoryColors: Record<string, string> = {
    'restaurantes': 'bg-orange-100 text-orange-700 border-orange-200',
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

    const price = recommendation.price_range || recommendation.metadata?.price_range
    const timeStr = recommendation.time || recommendation.metadata?.time
    const note = recommendation.personal_note || recommendation.metadata?.personal_note

    return (
        <Card
            className={cn(
                "relative group overflow-hidden border-none shadow-md hover:shadow-lg transition-all cursor-pointer bg-white rounded-3xl",
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 items-center">
                        <div className={cn("p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110", colorClass)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <CardTitle className="text-base font-bold leading-tight line-clamp-1">{recommendation.name}</CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{category}</p>
                        </div>
                    </div>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3 font-bold uppercase tracking-tight">
                    {recommendation.distance && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <MapPin className="w-3 h-3" />
                            {recommendation.distance}
                        </div>
                    )}
                    {timeStr && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                        </div>
                    )}
                    {price && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <span className="">{price}</span>
                        </div>
                    )}
                </div>

                {recommendation.description && (
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2 font-medium">
                        {recommendation.description}
                    </p>
                )}

                {note && (
                    <p className="text-slate-400 text-xs italic font-medium">
                        "{note}"
                    </p>
                )}
            </CardContent>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/10 rounded-3xl pointer-events-none transition-all" />
        </Card>
    )
}
