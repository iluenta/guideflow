'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Palette, Image as ImageIcon, Upload, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { PRESET_THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { getBrandingUploadUrl } from '@/app/actions/properties'
import axios from 'axios'

interface StepBrandingProps {
    data: any
    onChange: (data: any) => void
}

export function StepBranding({ data, onChange }: StepBrandingProps) {
    const [uploading, setUploading] = useState(false)

    const themes = [
        {
            id: 'elegant-navy',
            name: 'ELEGANTE NAVAL',
            subtitle: 'PROFESIONAL Y SOFISTICADO',
            headerColor: 'bg-[#1e3a8a]',
            dots: ['bg-[#1e3a8a]', 'bg-amber-400', 'bg-teal-500']
        },
        {
            id: 'warm-terracotta',
            name: 'TERRACOTA CÁLIDO',
            subtitle: 'ACOGEDOR Y MEDITERRÁNEO',
            headerColor: 'bg-[#c2410c]',
            dots: ['bg-[#c2410c]', 'bg-[#1e3a8a]', 'bg-amber-600']
        },
        {
            id: 'forest-green',
            name: 'VERDE BOSQUE',
            subtitle: 'NATURAL Y RELAJANTE',
            headerColor: 'bg-[#065f46]',
            dots: ['bg-[#065f46]', 'bg-[#7c2d12]', 'bg-[#ea580c]']
        },
        {
            id: 'modern-minimal',
            name: 'MINIMALISTA MODERNO',
            subtitle: 'LIMPIO Y CONTEMPORÁNEO',
            headerColor: 'bg-[#111827]',
            dots: ['bg-[#111827]', 'bg-[#4b5563]', 'bg-[#3b82f6]']
        }
    ]

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const { uploadUrl, publicUrl } = await getBrandingUploadUrl(file.name, file.type)
            
            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type }
            })

            onChange({ logo_url: publicUrl })
        } catch (error) {
            console.error('Error uploading logo:', error)
        } finally {
            setUploading(false)
        }
    }

    const currentThemeId = data.theme_id || 'elegant-navy'
    const currentPrimary = data.custom_primary_color || PRESET_THEMES.find(t => t.id === currentThemeId)?.colors.primary || '#1e3a8a'

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Apariencia de tu Guía</CardTitle>
                <CardDescription className="text-base">Elige un tema y personaliza los colores de tu guía mágica.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10 mt-6">
                {/* Theme Selection */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            ELIGE UN TEMA BASE
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {themes.map((theme) => {
                            const isSelected = currentThemeId === theme.id;
                            return (
                                <div
                                    key={theme.id}
                                    onClick={() => onChange({ theme_id: theme.id, custom_primary_color: null })}
                                    className="cursor-pointer group"
                                >
                                    {/* Preview Card */}
                                    <div
                                        className={cn(
                                            "relative bg-white rounded-2xl border-2 overflow-hidden mb-4 transition-all duration-300 shadow-sm",
                                            isSelected 
                                                ? "border-primary ring-2 ring-primary/10 shadow-md" 
                                                : "border-slate-100 group-hover:border-slate-200 group-hover:shadow"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 z-10 bg-primary text-white rounded-full p-1 shadow-lg">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                        {/* Header Bar */}
                                        <div className={cn("h-10 w-full mb-3", theme.headerColor)}></div>
                                        
                                        {/* Content Lines */}
                                        <div className="px-4 pb-5 space-y-3">
                                            <div className="flex gap-2">
                                                <div className="w-1/3 h-14 bg-slate-50 rounded-xl"></div>
                                                <div className="w-1/3 h-14 bg-slate-50 rounded-xl"></div>
                                                <div className="w-1/3 h-14 bg-slate-50 rounded-xl flex items-center justify-center">
                                                    <div className={cn("w-3 h-3 rounded-full shadow-sm", theme.dots[2])}></div>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-50 rounded-full"></div>
                                        </div>
                                        {/* Bottom Curve decoration */}
                                        <div className="h-2 w-full flex">
                                            <div className={cn("w-1/4 h-full rounded-tr-3xl", theme.dots[0])}></div>
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                                        {theme.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 opacity-70">
                                        {theme.subtitle}
                                    </p>

                                    {/* Dots */}
                                    <div className="flex gap-2.5 items-center">
                                        {theme.dots.map((dot, i) => (
                                            <div
                                                key={i}
                                                className={cn("w-4 h-4 rounded-full border border-white shadow-sm", dot)}
                                            ></div>
                                        ))}
                                        <div className="flex gap-1 items-center ml-1">
                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
                    {/* Brand Color */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                COLOR DE MARCA (OPCIONAL)
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-bold text-slate-800">Color Principal</Label>
                            <div className="flex items-center gap-5">
                                <div className="relative group">
                                    <Input 
                                        type="color" 
                                        value={currentPrimary} 
                                        onChange={(e) => onChange({ custom_primary_color: e.target.value })}
                                        className="h-14 w-14 p-0 rounded-full border-4 border-white shadow-xl cursor-pointer overflow-hidden"
                                    />
                                    <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 group-hover:opacity-100 pointer-events-none" />
                                </div>
                                
                                <div className="flex-1 flex gap-3">
                                    <div className={cn("h-14 w-20 rounded-2xl shadow-inner border border-slate-100")} style={{ backgroundColor: currentPrimary }}></div>
                                    <div className="flex-1 bg-slate-50 rounded-2xl px-5 flex items-center h-14 font-mono font-bold text-slate-600 border border-slate-100 uppercase tracking-widest text-sm">
                                        {currentPrimary}
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">
                                * El sistema ajustará automáticamente los colores secundarios para
                                mantener la armonía visual de tu guía.
                            </p>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                LOGO DE LA PROPIEDAD
                            </h3>
                        </div>

                        <div className={cn(
                            "group relative border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50 hover:bg-white hover:border-primary/50 overflow-hidden",
                            data.logo_url && "border-emerald-200 bg-emerald-50/10"
                        )}>
                            {data.logo_url ? (
                                <div className="relative w-full aspect-square max-w-[120px] mb-4 group/logo">
                                    <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={() => onChange({ logo_url: null })}
                                        className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 rounded-full p-1.5 shadow-md border border-slate-100 transition-all hover:scale-110 z-20"
                                        title="Eliminar logo"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary transition-colors">
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                                        Sube tu logotipo
                                    </h4>
                                    <p className="text-xs text-slate-400 mb-6 font-medium">
                                        PNG o SVG ligero (Max 1MB)
                                    </p>
                                </>
                            )}
                            
                            {!data.logo_url && (
                                <div className="relative">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white border-slate-200 text-xs font-bold px-6 h-10 rounded-full shadow-sm pointer-events-none"
                                        disabled={uploading}
                                    >
                                        SELECCIONAR ARCHIVO
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                    />
                                </div>
                            )}

                            {!data.logo_url && (
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
