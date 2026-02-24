'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Upload, X, Loader2 } from 'lucide-react'
import { ThemePreviewCard } from '../../ThemePreviewCard'
import { PRESET_THEMES } from '@/lib/themes'
import { harmonizeThemeFromPrimary } from '@/lib/color-harmonizer'
import { useWizard } from '../WizardContext'
import { getBrandingUploadUrl } from '@/app/actions/properties'
import { useToast } from '@/hooks/use-toast'

export default function StepAppearance({ value }: { value?: string }) {
    const { 
        data, 
        setData, 
        uploading, 
        setUploading
    } = useWizard()
    const { toast } = useToast()

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const { uploadUrl, publicUrl } = await getBrandingUploadUrl(file.name, file.type)

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
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

    const triggerLogoUpload = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e: any) => handleLogoUpload(e)
        input.click()
    }

    return (
        <TabsContent value="appearance" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-base">Apariencia de tu Guía</CardTitle>
                    <CardDescription className="text-xs">Elige un tema y personaliza los colores de tu guía mágica.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="space-y-4">
                        <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                            🎨 ELIGE UN TEMA BASE
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {PRESET_THEMES.map((theme) => (
                                <ThemePreviewCard
                                    key={theme.id}
                                    theme={theme}
                                    logoUrl={data.branding?.custom_logo_url}
                                    propertyName={data.property?.name}
                                    isSelected={data.branding?.theme_id === theme.id}
                                    onSelect={() => {
                                        setData((prev: any) => ({
                                            ...prev,
                                            branding: {
                                                ...prev.branding,
                                                theme_id: theme.id,
                                                computed_theme: prev.branding?.custom_primary_color
                                                    ? harmonizeThemeFromPrimary(theme, prev.branding.custom_primary_color)
                                                    : theme
                                            }
                                        }))
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-navy/5">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                                <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                                    🌈 COLOR DE MARCA (OPCIONAL)
                                </h3>
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-navy">Color Principal</Label>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="h-10 w-10 rounded-xl shadow-inner border border-navy/5 shrink-0"
                                            style={{ backgroundColor: data.branding?.custom_primary_color || data.branding?.computed_theme?.colors.primary }}
                                        />
                                        <Input
                                            type="color"
                                            className="w-16 h-10 p-1 rounded-lg cursor-pointer bg-white border-navy/10"
                                            value={data.branding?.custom_primary_color || data.branding?.computed_theme?.colors.primary || '#000000'}
                                            onChange={(e) => {
                                                const color = e.target.value
                                                const baseTheme = PRESET_THEMES.find(t => t.id === data.branding.theme_id) || PRESET_THEMES[0]
                                                const harmonized = harmonizeThemeFromPrimary(baseTheme, color)
                                                setData((prev: any) => ({
                                                    ...prev,
                                                    branding: {
                                                        ...prev.branding,
                                                        custom_primary_color: color,
                                                        computed_theme: harmonized
                                                    }
                                                }))
                                            }}
                                        />
                                        <Input
                                            type="text"
                                            className="flex-1 h-10 font-mono text-xs"
                                            value={data.branding?.custom_primary_color || data.branding?.computed_theme?.colors.primary}
                                            onChange={(e) => {
                                                const color = e.target.value
                                                if (/^#[0-9A-F]{6}$/i.test(color)) {
                                                    const baseTheme = PRESET_THEMES.find(t => t.id === data.branding.theme_id) || PRESET_THEMES[0]
                                                    const harmonized = harmonizeThemeFromPrimary(baseTheme, color)
                                                    setData((prev: any) => ({
                                                        ...prev,
                                                        branding: {
                                                            ...prev.branding,
                                                            custom_primary_color: color,
                                                            computed_theme: harmonized
                                                        }
                                                    }))
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-navy/40 italic">
                                        * El sistema ajustará automáticamente los colores secundarios para mantener la armonía visual.
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                                    🏢 LOGO DE LA PROPIEDAD
                                </h3>
                                <div className="space-y-3">
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
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
