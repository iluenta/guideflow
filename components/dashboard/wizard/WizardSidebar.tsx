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
                    className="fixed inset-0 bg-landing-navy/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-[300px] bg-white border-r border-landing-rule-soft transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:z-0 lg:rounded-[32px] lg:sticky lg:top-[100px]",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 shadow-2xl lg:shadow-none"
            )}>
                <div className="flex flex-col h-full">
                    {/* Header with Close Button (Mobile Only) */}
                    <div className="flex items-center justify-between p-6 lg:hidden">
                        <span className="text-xl font-bold text-landing-navy">Secciones</span>
                        <button onClick={onClose} className="p-2 hover:bg-landing-bg-deep rounded-xl transition-colors">
                            <X className="h-6 w-6 text-landing-ink-mute" />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 p-4 space-y-1.5">
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
                                        "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group",
                                        isActive
                                            ? "bg-landing-navy text-white shadow-lg shadow-landing-navy/20"
                                            : "text-landing-ink-soft hover:bg-landing-bg-deep",
                                        disabled && "opacity-50 cursor-not-allowed grayscale pointer-events-auto"
                                    )}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn(
                                            "h-9 w-9 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                            isActive ? "bg-white/20 text-white" : "bg-landing-bg-deep text-landing-ink-mute group-hover:bg-white group-hover:text-landing-navy"
                                        )}>
                                            <Icon className="h-[18px] w-[18px] stroke-[1.75]" />
                                        </div>
                                        <span className={cn(
                                            "font-bold text-xs uppercase tracking-wider",
                                            isActive ? "text-white" : "text-landing-ink"
                                        )}>
                                            {item.title}
                                        </span>
                                    </div>

                                    {item.status === 'complete' && (
                                        <CheckCircle2 className={cn("h-4 w-4", isActive ? "text-landing-mint" : "text-landing-mint-deep")} />
                                    )}
                                    {item.status === 'incomplete' && !isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-landing-bg-deep" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Footer / Pro Plan Info */}
                    <div className="p-4 border-t border-landing-rule-soft mt-auto">
                        <div className="bg-gradient-to-br from-landing-navy to-landing-navy-soft rounded-[20px] p-5 text-white overflow-hidden relative shadow-md">
                            <div className="relative z-10">
                                <div className="font-jetbrains text-[9px] tracking-widest uppercase opacity-70 mb-1">Plan Actual</div>
                                <h4 className="font-bold text-sm mb-3">Hospyia Pro</h4>
                                <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-landing-mint w-full"></div>
                                </div>
                                <button className="w-full bg-white text-landing-navy py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-landing-mint transition-colors">
                                    Gestionar Plan
                                </button>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
