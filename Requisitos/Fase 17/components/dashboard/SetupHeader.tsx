'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SetupHeaderProps {
    name: string
    location: string
    progress: number
    essentials: Array<{ id: string, label: string, status: boolean }>
    onEssentialClick?: (id: string) => void
}

export function SetupHeader({ name, location, progress, essentials, onEssentialClick }: SetupHeaderProps) {
    // Circle progress calculation
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <Card className="rounded-[32px] border-none shadow-premium bg-white overflow-hidden">
            <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                {/* Progress Circle container */}
                <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-32 h-32 md:w-40 md:h-40 rotate-[-90deg]">
                        <circle
                            className="text-gray-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="50%"
                            cy="50%"
                        />
                        <circle
                            className="text-primary transition-all duration-1000 ease-in-out"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="50%"
                            cy="50%"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-3xl md:text-4xl font-black text-text-primary">{progress}%</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">COMPLETO</span>
                    </div>
                </div>

                {/* Info and Checklist */}
                <div className="flex-1 space-y-8 text-center md:text-left">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-bold">{name}</h1>
                        <p className="text-text-secondary flex items-center justify-center md:justify-start gap-1.5">
                            <span className="inline-block w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">📍</span>
                            {location}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        {essentials.map((item) => (
                            <div 
                                key={item.id} 
                                className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors"
                                onClick={() => onEssentialClick?.(item.id)}
                            >
                                {item.status ? (
                                    <div className="h-5 w-5 bg-emerald-50 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-200" />
                                )}
                                <span className={item.status ? "text-text-primary" : "text-text-secondary"}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
