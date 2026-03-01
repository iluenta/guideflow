'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Upload, X, Loader2, Check, Palette, Sparkles } from 'lucide-react'
import { LAYOUT_THEMES, getLayoutTheme } from '@/lib/themes'
import { useWizard } from '../WizardContext'
import { getBrandingUploadUrl } from '@/app/actions/properties'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function StepAppearance({ value }: { value?: string }) {
    const {
        data,
        setData,
        uploading,
        setUploading
    } = useWizard()
    const { toast } = useToast()

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

    const triggerLogoUpload = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
                setUploading(true)
                const { uploadUrl, publicUrl } = await getBrandingUploadUrl(file.name, file.type)
                const response = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                })
                if (!response.ok) throw new Error('Error al subir el logo')
                setData((prev: any) => ({
                    ...prev,
                    branding: { ...prev.branding, custom_logo_url: publicUrl }
                }))
                toast({ title: 'Logo subido', description: 'Tu logotipo se ha guardado.' })
            } catch (error) {
                console.error('Logo upload error:', error)
                toast({ title: 'Error de subida', description: 'No pudimos subir el logo.', variant: 'destructive' })
            } finally {
                setUploading(false)
            }
        }
        input.click()
    }

    return (
        <TabsContent value="appearance" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Theme Selector */}
                <div className="lg:col-span-7 space-y-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center text-[#316263]">
                            <Palette className="h-4 w-4" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Selecciona un Estilo</h3>
                    </div>

                    <div className="grid gap-4">
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
                                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                                    )}
                                >
                                    <div className={cn(
                                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform duration-500 group-hover:scale-110',
                                        theme.iconBg
                                    )}>
                                        {theme.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-base text-slate-900">
                                                {theme.name}
                                            </span>
                                            {isDisabled && (
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full uppercase tracking-tighter">
                                                    Próximamente
                                                </Badge>
                                            )}
                                        </div>
                                        <p className={cn('text-[9px] font-bold uppercase tracking-widest mb-1', theme.tagColor)}>
                                            {theme.tagline}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            {theme.description}
                                        </p>
                                    </div>

                                    <div className={cn(
                                        'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                                        isSelected
                                            ? 'border-[#316263] bg-[#316263] scale-110 shadow-lg shadow-teal-900/20'
                                            : 'border-slate-200'
                                    )}>
                                        {isSelected && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#316263]/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Branding & Info */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Logo Section */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#316263]">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Identidad Visual</h3>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Logotipo del Alojamiento</Label>
                            <div className="relative group min-h-[180px] border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 transition-all hover:border-[#316263]/30 hover:bg-white cursor-pointer" onClick={triggerLogoUpload}>
                                {data.branding?.custom_logo_url ? (
                                    <div className="relative group w-full flex justify-center">
                                        <img
                                            src={data.branding.custom_logo_url}
                                            alt="Logo"
                                            className="max-h-24 object-contain drop-shadow-md"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setData((prev: any) => ({ ...prev, branding: { ...prev.branding, custom_logo_url: '' } }))
                                            }}
                                            className="absolute -top-3 -right-3 h-8 w-8 bg-white shadow-sm shadow-slate-200/40 rounded-xl text-red-500 flex items-center justify-center hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-3">
                                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 mx-auto shadow-sm group-hover:text-[#316263] group-hover:rotate-12 transition-all duration-500">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-900">Sube tu logotipo</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">PNG o SVG (Max 500KB)</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-10 rounded-xl px-6 text-xs font-bold uppercase tracking-widest border-slate-200 mt-2"
                                            disabled={uploading}
                                        >
                                            {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Seleccionar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="bg-[#111827] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm shadow-slate-200/40">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-teal-400 tracking-[0.3em] uppercase mb-6">Cada tema incluye</p>
                            <div className="space-y-4">
                                {[
                                    'Tipografía curada', 'Paleta cromática exclusiva',
                                    'Estructura de navegación', 'Animaciones premium',
                                    'Densidad visual optimizada', 'Diseño Responsive'
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-teal-500/50" />
                                        <span className="text-sm font-medium text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </TabsContent>
    )
}
