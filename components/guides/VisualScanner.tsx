'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Camera,
    Image as ImageIcon,
    X,
    Sparkles,
    Plus,
    Trash2,
    Loader2,
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { getScanUploadUrl, updateInventoryStatus } from '@/app/actions/properties'
import { processBatchScans } from '@/app/actions/ai-ingestion'

interface VisualScannerProps {
    propertyId: string
    onStart?: () => void
    onSuccess?: () => void
}

interface SelectedPhoto {
    id: string
    file: File
    preview: string
}

export function VisualScanner({ propertyId, onStart, onSuccess }: VisualScannerProps) {
    const [photos, setPhotos] = useState<SelectedPhoto[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
    const [replaceExisting, setReplaceExisting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Limit to 30 photos total
        const remainingSlots = 30 - photos.length
        if (remainingSlots <= 0) {
            toast.error('Has alcanzado el límite máximo de 30 fotos')
            return
        }

        const filesToProcess = files.slice(0, remainingSlots)
        if (files.length > remainingSlots) {
            toast.warning(`Solo se han añadido las primeras ${remainingSlots} fotos (Límite: 30)`)
        }

        const newPhotos: SelectedPhoto[] = filesToProcess.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file)
        }))

        setPhotos(prev => [...prev, ...newPhotos])

        // Reset input value to allow selecting the same file again
        if (e.target) {
            e.target.value = ''
        }
    }

    const removePhoto = (id: string) => {
        if (uploadingIds.has(id)) return // Don't remove while uploading
        setPhotos(prev => {
            const photoToRemove = prev.find(p => p.id === id)
            if (photoToRemove) {
                URL.revokeObjectURL(photoToRemove.preview)
            }
            return prev.filter(p => p.id !== id)
        })
    }

    const handleAnalyze = async () => {
        if (photos.length === 0) {
            toast.error('Selecciona al menos una foto para analizar')
            return
        }

        setIsAnalyzing(true)
        if (onStart) onStart()

        // Update DB status immediately to 'generating' so polling in parent works during uploads
        await updateInventoryStatus(propertyId, 'generating')

        try {
            toast.loading('Subiendo fotos...', { id: 'analyze-process' })

            // 1. Upload photos and get public URLs
            const uploadedUrls = await Promise.all(
                photos.map(async (photo) => {
                    setUploadingIds(prev => new Set(prev).add(photo.id))

                    try {
                        // Pass propertyId to the action as updated in previous step
                        const { uploadUrl, publicUrl } = await getScanUploadUrl(propertyId, photo.file.name, photo.file.type)

                        const response = await fetch(uploadUrl, {
                            method: 'PUT',
                            body: photo.file,
                            headers: {
                                'Content-Type': photo.file.type,
                            },
                        })

                        if (!response.ok) throw new Error(`Error al subir ${photo.file.name}`)
                        return publicUrl
                    } finally {
                        setUploadingIds(prev => {
                            const next = new Set(prev)
                            next.delete(photo.id)
                            return next
                        })
                    }
                })
            )

            toast.loading('Analizando con IA...', { id: 'analyze-process' })

            // 2. Process with AI (Fase 1)
            const result = await processBatchScans(propertyId, uploadedUrls, replaceExisting)

            toast.success(`Análisis completado: Se han generado ${result.identifiedCount} manuales técnicos`, { id: 'analyze-process' })

            // Clear photos after success
            setPhotos([])

            // Notify parent
            if (onSuccess) onSuccess()
        } catch (error: any) {
            console.error('Analyze error:', error)
            toast.error('Error al analizar las fotos: ' + error.message, { id: 'analyze-process' })
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="relative space-y-6 pb-4">
            {/* Header / Intro */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">Escáner Visual con IA</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                        {photos.length}/30
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Sube fotos de tu propiedad para que la IA detecte automáticamente servicios,
                    normas y detalles importantes para tu guía.
                </p>
            </div>

            {/* Photo Tips - Always Visible & Compact */}
            <Card className="border-primary/10 bg-primary/5 rounded-2xl overflow-hidden shadow-none border">
                <div className="p-3 border-b border-primary/10 bg-primary/5 flex items-center gap-2 text-primary">
                    <Info className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cómo fotografiar para el análisis IA</span>
                </div>
                <CardContent className="p-3 space-y-3">
                    <div className="grid gap-3 grid-cols-2">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold flex items-center gap-1.5 text-primary">
                                <span className="h-1 w-1 rounded-full bg-primary" />
                                "DNI" del aparato
                            </p>
                            <p className="text-muted-foreground text-[9px] leading-tight">
                                Foto a la pegatina del modelo/serie (E-Nr) para instrucciones exactas.
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold flex items-center gap-1.5 text-primary">
                                <span className="h-1 w-1 rounded-full bg-primary" />
                                Ángulo 45º
                            </p>
                            <p className="text-muted-foreground text-[9px] leading-tight">
                                Permite detectar mandos táctiles o escamoteables mediante sombras.
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold flex items-center gap-1.5 text-primary">
                                <span className="h-1 w-1 rounded-full bg-primary" />
                                Sin reflejos
                            </p>
                            <p className="text-muted-foreground text-[9px] leading-tight">
                                Evita el flash en pantallas. Los reflejos bloquean la lectura de iconos.
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold flex items-center gap-1.5 text-primary">
                                <span className="h-1 w-1 rounded-full bg-primary" />
                                Regla 75%
                            </p>
                            <p className="text-muted-foreground text-[9px] leading-tight">
                                El panel de mandos debe ocupar la mayor parte de la foto.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* MultiPhotoSelector / Dropzone - Slimmer */}
            <div
                className="border-2 border-dashed border-primary/20 rounded-3xl p-6 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileChange}
                />
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3">
                    <Camera className="h-6 w-6" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-sm">Abrir cámara o subir fotos</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Hasta 30 fotos de electrodomésticos o estancias
                    </p>
                </div>
            </div>

            {/* Thumbnail Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {photos.map((photo) => (
                        <Card key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group border-none shadow-md">
                            <Image
                                src={photo.preview}
                                alt="Preview"
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />

                            {/* Individual Upload Progress Overlay */}
                            {uploadingIds.has(photo.id) && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Subiendo</span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-10 w-10 rounded-full"
                                    disabled={uploadingIds.has(photo.id)}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removePhoto(photo.id)
                                    }}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {/* Add more button in grid */}
                    {photos.length < 30 && (
                        <button
                            className="aspect-square rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Plus className="h-6 w-6 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Añadir</span>
                        </button>
                    )}
                </div>
            )}

            {/* Replacement Toggle & Analysis Button Container */}
            <div className="bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/10 p-4 space-y-4">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setReplaceExisting(!replaceExisting)}>
                    <div className={`h-6 w-11 rounded-full relative transition-colors duration-300 ${replaceExisting ? 'bg-primary' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform duration-300 ${replaceExisting ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">Actualizar manuales si ya existen</p>
                        <p className="text-[10px] text-muted-foreground">Si la IA detecta un aparato que ya tienes, lo sustituirá por la nueva versión.</p>
                    </div>
                </div>

                <Button
                    className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold gap-2"
                    disabled={photos.length === 0 || isAnalyzing}
                    onClick={handleAnalyze}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analizando estancia...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5 fill-current" />
                            Analizar Estancia con IA
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
