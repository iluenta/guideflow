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
        <header className="bg-white/80 backdrop-blur-xl border-b border-landing-rule-soft sticky top-0 z-40 h-[72px]">
            <div className="max-w-[1600px] mx-auto px-6 h-full">
                <div className="flex items-center justify-between h-full gap-4">

                    {/* Left: Breadcrumbs */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-xl hover:bg-landing-bg-deep transition-colors text-landing-ink-soft shrink-0"
                            aria-label="Abrir menú de secciones"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <nav className="flex items-center gap-2.5 font-jetbrains text-[11px] tracking-[0.1em] uppercase text-landing-ink-mute whitespace-nowrap overflow-hidden">
                            <Link
                                href="/dashboard/properties"
                                className="hover:text-landing-navy transition-colors"
                            >
                                Propiedades
                            </Link>
                            <span className="opacity-50">/</span>
                            <span className="text-landing-ink truncate">
                                {propertyName}
                            </span>
                        </nav>
                    </div>

                    {/* Right: Progress & View */}
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Circular Progress */}
                        <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 flex items-center justify-center">
                                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-landing-bg-deep" />
                                    <circle
                                        cx="24" cy="24" r={radius}
                                        stroke="currentColor" strokeWidth="3.5"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        className="text-landing-mint-deep"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute font-jetbrains text-[10px] font-bold text-landing-navy">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-xs font-bold text-landing-navy">Progreso</div>
                                <div className="text-[10px] font-bold text-landing-mint-deep uppercase tracking-wider tabular-nums">
                                    {Math.round(progress)}% completado
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-landing-rule-soft mx-1"></div>

                        <Button
                            onClick={onViewGuide}
                            className="bg-landing-navy text-white h-10 px-5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-landing-navy-deep transition-all shadow-lg shadow-landing-navy/10 flex items-center gap-2 active:scale-95"
                        >
                            <span>Ver Guía</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                </div>
            </div>
        </header>
    )
}