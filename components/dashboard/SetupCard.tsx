'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowRight, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SetupCardProps {
    title: string
    description: string
    icon: LucideIcon
    points: string
    color: string
    status: boolean
    actionLabel: string
    onClick: () => void
}

export function SetupCard({ 
    title, 
    description, 
    icon: Icon, 
    points, 
    color, 
    status, 
    actionLabel, 
    onClick 
}: SetupCardProps) {
    return (
        <Card className="group hover:shadow-premium transition-all duration-300 border-none bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", color)}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {status ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none rounded-full px-3 py-1 gap-1">
                            <Check className="h-3 w-3" /> Completado
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-gray-50 text-emerald-600 font-bold border-none rounded-lg px-2 py-0.5">
                            {points}
                        </Badge>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-text-secondary text-sm">{description}</p>
                </div>

                <Button 
                    variant="outline" 
                    className={cn(
                        "w-full h-12 rounded-xl justify-between px-4 font-bold transition-all",
                        status 
                            ? "border-emerald-100 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200" 
                            : "border-gray-100 hover:border-primary hover:bg-primary/5 text-text-primary"
                    )}
                    onClick={onClick}
                >
                    {actionLabel}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </CardContent>
        </Card>
    )
}
