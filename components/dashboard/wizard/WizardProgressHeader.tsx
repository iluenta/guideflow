'use client'

import React from 'react'
import { ChevronRight, ExternalLink, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WizardProgressHeaderProps {
    propertyName: string
    progress: number
    onMenuClick: () => void
    onViewGuide?: () => void
}

export function WizardProgressHeader({
    propertyName,
    progress,
    onMenuClick,
    onViewGuide,
}: WizardProgressHeaderProps) {
    // Calculate circle circumference for SVG stroke-dasharray
    const radius = 16
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 h-16">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-full">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-500"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <nav className="flex items-center gap-3 text-sm font-medium">
                            <span className="text-slate-400">Propiedades</span>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                            <span className="text-slate-900 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 italic font-serif">
                                {propertyName}
                            </span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="relative h-12 w-12 flex items-center justify-center">
                                <svg className="h-full w-full transform -rotate-90">
                                    <circle
                                        cx="24"
                                        cy="24"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="3.5"
                                        fill="transparent"
                                        className="text-slate-100"
                                    />
                                    <circle
                                        cx="24"
                                        cy="24"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="3.5"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                                        className="text-[#316263]"
                                    />
                                </svg>
                                <span className="absolute text-[11px] font-bold text-slate-900 tracking-tighter">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-bold text-slate-900">Configuración</div>
                                <div className="text-[11px] font-bold text-[#316263] uppercase tracking-wider tabular-nums">
                                    Completada al {Math.round(progress)}%
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={onViewGuide}
                            className="bg-[#316263] text-white px-4 h-10 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-teal-900/10 hidden sm:flex items-center gap-2"
                        >
                            Ver Guía
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
