'use client'

import React from 'react'
import Link from 'next/link'
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
    const radius = 16
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 h-16">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 h-full">
                <div className="flex items-center justify-between h-full gap-3">

                    {/* ── IZQUIERDA ──────────────────────────────────── */}
                    <div className="flex items-center gap-2 min-w-0">

                        {/* Hamburguesa — siempre visible */}
                        <button
                            onClick={onMenuClick}
                            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 shrink-0"
                            aria-label="Abrir menú de secciones"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Móvil: solo nombre de la propiedad */}
                        <span className="lg:hidden text-sm font-semibold text-slate-800 italic font-serif truncate">
                            {propertyName}
                        </span>

                        {/* Desktop: breadcrumb completo */}
                        <nav className="hidden lg:flex items-center gap-3 text-sm font-medium">
                            <Link
                                href="/dashboard/properties"
                                className="text-slate-400 hover:text-slate-900 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded px-1 -mx-1"
                            >
                                Propiedades
                            </Link>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                            <span className="text-slate-900 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 italic font-serif truncate max-w-[200px]">
                                {propertyName}
                            </span>
                        </nav>
                    </div>

                    {/* ── DERECHA ────────────────────────────────────── */}
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">

                        {/* Progreso circular */}
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 md:h-12 md:w-12 flex items-center justify-center">
                                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-slate-100" />
                                    <circle
                                        cx="24" cy="24" r={radius}
                                        stroke="currentColor" strokeWidth="3.5"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                                        className="text-[#316263]"
                                    />
                                </svg>
                                <span className="absolute text-[10px] md:text-[11px] font-bold text-slate-900 tracking-tighter">
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

                        {/* Botón Ver Guía */}
                        <Button
                            onClick={onViewGuide}
                            className="bg-[#316263] text-white px-3 sm:px-4 h-9 md:h-10 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-teal-900/10 flex items-center gap-1.5 text-sm"
                        >
                            <span className="hidden sm:inline">Ver Guía</span>
                            <span className="sm:hidden">Guía</span>
                            <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                    </div>

                </div>
            </div>
        </header>
    )
}