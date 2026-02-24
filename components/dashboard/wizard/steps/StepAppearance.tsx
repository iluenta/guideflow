'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TabsContent } from '@/components/ui/tabs'
import { Upload, X, Loader2, Check } from 'lucide-react'
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
                theme_id: themeId, // backward compat
                // Store the full computed_theme from the forced palette
                computed_theme: theme,
                // Clear any legacy custom color — theme palette is forced
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
        <TabsContent value="appearance" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-4 px-6">
                    <CardTitle className="text-base font-bold text-navy">Guest Guide Studio</CardTitle>
                    <CardDescription className="text-xs text-navy/50">
                        Mismo contenido. Diferente alma. Cada propiedad merece su propia identidad.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* ── Theme Selector List ── */}
                    <div className="space-y-2">
                        {LAYOUT_THEMES.map((theme) => {
                            const isSelected = currentThemeId === theme.id
                            const isDisabled = !theme.implemented

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => !isDisabled && handleSelectTheme(theme.id)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                                        isSelected
                                            ? 'border-navy bg-navy/[0.03]'
                                            : isDisabled
                                            ? 'border-navy/10 opacity-50 cursor-not-allowed'
                                            : 'border-navy/10 hover:border-navy/30 cursor-pointer'
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl',
                                        theme.iconBg
                                    )}>
                                        {theme.icon}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm text-navy">
                                                {theme.name}
                                            </span>
                                            {isDisabled && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                                    Próximamente
                                                </Badge>
                                            )}
                                        </div>
                                        <p className={cn('text-[11px] font-semibold mb-1', theme.tagColor)}>
                                            {theme.tagline}
                                        </p>
                                        <p className="text-[11px] text-navy/40 leading-tight truncate">
                                            {theme.description}
                                        </p>
                                    </div>

                                    {/* Checkmark */}
                                    <div className={cn(
                                        'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                                        isSelected
                                            ? 'border-navy bg-navy'
                                            : 'border-navy/20'
                                    )}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* ── "Lo que cambia con cada tema" info row ── */}
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase mb-3">
                            LO QUE CAMBIA CON CADA TEMA
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                            {[
                                'Tipografía', 'Paleta de color',
                                'Estructura de layout', 'Estilo de tarjetas',
                                'Tratamiento del hero', 'Densidad visual',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-[11px] text-navy/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-navy/30 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Logo Upload ── */}
                    <div className="space-y-3 pt-2 border-t border-navy/5">
                        <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                            🏢 LOGO DE LA PROPIEDAD
                        </h3>
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-navy/10 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                            {data.branding?.custom_logo_url ? (
                                <div className="relative group">
                                    <img
                                        src={data.branding.custom_logo_url}
                                        alt="Logo"
                                        className="max-h-24 object-contain"
                                    />
                                    <button
                                        onClick={() => setData((prev: any) => ({ ...prev, branding: { ...prev.branding, custom_logo_url: '' } }))}
                                        className="absolute -top-2 -right-2 p-1 bg-white shadow-md rounded-full text-navy/40 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-navy/20 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                    <p className="text-xs font-bold text-navy">Sube tu logotipo</p>
                                    <p className="text-[10px] text-navy/30">PNG o SVG ligero (Max 500KB)</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 h-8 text-[10px] font-bold uppercase tracking-wider"
                                        disabled={uploading}
                                        onClick={triggerLogoUpload}
                                    >
                                        {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                        Seleccionar Archivo
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
