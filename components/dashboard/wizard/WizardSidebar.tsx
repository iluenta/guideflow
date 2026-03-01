'use client'

import React from 'react'
import {
    Home,
    Palette,
    MapPin,
    MessageSquare,
    Phone,
    Key,
    ShieldCheck,
    Wifi,
    Camera,
    ListChecks,
    Utensils,
    HelpCircle,
    CheckCircle2,
    AlertCircle,
    Circle,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
    id: string
    title: string
    icon: React.ElementType
    status: 'complete' | 'partial' | 'incomplete'
}

interface WizardSidebarProps {
    items: SidebarItem[]
    activeId: string
    onItemClick: (id: string) => void
    isOpen: boolean
    onClose: () => void
    disabled?: boolean
}

export function WizardSidebar({
    items,
    activeId,
    onItemClick,
    isOpen,
    onClose,
    disabled = false,
}: WizardSidebarProps) {
    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:z-0",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full">
                    {/* Header with Close Button (Mobile Only) */}
                    <div className="flex items-center justify-between p-6 lg:hidden">
                        <span className="text-xl font-bold text-slate-900">Menú</span>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide no-scrollbar">
                        {items.map((item) => {
                            const Icon = item.icon
                            const isActive = activeId === item.id

                            return (
                                <button
                                    key={item.id}
                                    disabled={disabled}
                                    onClick={() => {
                                        onItemClick(item.id)
                                        onClose()
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                        isActive
                                            ? "bg-[#316263]/5 text-[#316263] border border-[#316263]/10"
                                            : "text-slate-500 hover:bg-slate-50 border border-transparent",
                                        disabled && "opacity-50 cursor-not-allowed grayscale"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                            isActive ? "bg-[#316263] text-white" : "bg-white text-slate-400 group-hover:bg-white group-hover:text-slate-600 border border-slate-100"
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className={cn(
                                            "font-bold text-sm tracking-tight",
                                            isActive ? "text-[#316263]" : "text-slate-600"
                                        )}>
                                            {item.title}
                                        </span>
                                    </div>

                                    {item.status === 'complete' && (
                                        <CheckCircle2 className="h-4.5 w-4.5 text-[#316263]" />
                                    )}
                                    {item.status === 'partial' && (
                                        <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                                    )}
                                    {item.status === 'incomplete' && (
                                        <Circle className="h-4.5 w-4.5 text-slate-200" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Footer / Pro Plan Info */}
                    <div className="p-6 border-t border-slate-50">
                        <div className="bg-[#316263] rounded-3xl p-6 text-white overflow-hidden relative shadow-sm">
                            <div className="relative z-10">
                                <h4 className="font-serif italic text-lg mb-1">Plan Premium</h4>
                                <p className="text-[11px] text-teal-100 font-bold uppercase tracking-widest opacity-80">
                                    Guía Ilimitada Activa
                                </p>
                                <button className="mt-4 w-full bg-white text-[#316263] py-2.5 rounded-xl text-xs font-bold hover:bg-teal-50 transition-colors shadow-lg">
                                    Mejorar Plan
                                </button>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
