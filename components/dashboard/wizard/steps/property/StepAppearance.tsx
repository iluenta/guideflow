'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Check, Palette } from 'lucide-react'
import { LAYOUT_THEMES, getLayoutTheme } from '@/lib/themes'
import { useWizard } from '../../WizardContext'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function StepAppearance({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    const currentThemeId = data.branding?.layout_theme_id || 'modern'

    const handleSelectTheme = (themeId: string) => {
        const theme = getLayoutTheme(themeId)
        setData((prev: any) => ({
            ...prev,
            branding: {
                ...prev.branding,
                layout_theme_id: themeId,
                theme_id: themeId,
                computed_theme: theme,
                custom_primary_color: null,
            }
        }))
    }

    return (
        <TabsContent value="appearance" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-6">
                {/* Theme Selector */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center text-[#316263]">
                            <Palette className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Selecciona un estilo</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Define la apariencia visual de la guía para tus huéspedes</p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {LAYOUT_THEMES.map((theme) => {
                            const isSelected = currentThemeId === theme.id
                            const isDisabled = !theme.implemented

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => !isDisabled && handleSelectTheme(theme.id)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 relative overflow-hidden group',
                                        isSelected
                                            ? 'border-[#316263] bg-[#316263]/5 ring-4 ring-[#316263]/5'
                                            : isDisabled
                                                ? 'border-slate-100 opacity-40 cursor-not-allowed'
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer'
                                    )}
                                >
                                    <div className={cn(
                                        'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform duration-500 group-hover:scale-110',
                                        theme.iconBg
                                    )}>
                                        {theme.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm text-slate-900">{theme.name}</span>
                                            {isDisabled && (
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full uppercase tracking-tighter">
                                                    Próximamente
                                                </Badge>
                                            )}
                                        </div>
                                        <p className={cn('text-[9px] font-bold uppercase tracking-widest mb-1', theme.tagColor)}>
                                            {theme.tagline}
                                        </p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {theme.description}
                                        </p>
                                    </div>

                                    <div className={cn(
                                        'shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                                        isSelected
                                            ? 'border-[#316263] bg-[#316263] scale-110 shadow-lg shadow-teal-900/20'
                                            : 'border-slate-200'
                                    )}>
                                        {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#316263]/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Features list */}
                <div className="bg-[#111827] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-teal-400 tracking-widest uppercase mb-5">Cada tema incluye</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                'Tipografía curada',
                                'Paleta cromática exclusiva',
                                'Estructura de navegación',
                                'Animaciones premium',
                                'Densidad visual optimizada',
                                'Diseño responsive',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-teal-500/50 shrink-0" />
                                    <span className="text-sm font-medium text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                </div>
            </div>
        </TabsContent>
    )
}
