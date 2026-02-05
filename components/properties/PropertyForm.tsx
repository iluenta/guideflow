'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Property, createProperty, updateProperty, getUploadUrl } from '@/app/actions/properties'
import { generateManualFromImage } from '@/app/actions/ai-ingestion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Loader2, Upload, X, Home, MapPin, Users, Bed, Bath, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

const propertySchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
    full_address: z.string().min(3, 'La ubicación es requerida'),
    beds: z.number().min(0).default(1),
    baths: z.number().min(0).default(1),
    guests: z.number().min(1).default(2),
    description: z.string().optional(),
    main_image_url: z.string().optional().nullable(),
    theme_config: z.object({
        primary_color: z.string().startsWith('#').default('#ef4444'),
    }).default({ primary_color: '#ef4444' }),
})

type PropertyFormValues = z.infer<typeof propertySchema>

interface PropertyFormProps {
    property?: Property
    onSuccess: () => void
    onCancel: () => void
}

export function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(property?.main_image_url || null)
    const [analyzing, setAnalyzing] = useState(false)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!property?.slug)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD') // Normalize to handle accents
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .trim()
            .replace(/\s+/g, '-') // Spaces to dashes
            .replace(/-+/g, '-') // Multiple dashes to single
    }

    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            name: property?.name || '',
            slug: property?.slug || '',
            full_address: property?.full_address || '',
            beds: property?.beds || 1,
            baths: property?.baths || 1,
            guests: property?.guests || 2,
            description: property?.description || '',
            main_image_url: property?.main_image_url || null,
            theme_config: property?.theme_config || { primary_color: '#ef4444' },
        },
    })

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)

        try {
            setUploading(true)
            const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type)

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            })

            if (!response.ok) throw new Error('Error al subir la imagen')

            form.setValue('main_image_url', publicUrl)
            toast.success('Imagen subida correctamente')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Error al subir la imagen')
            setPreview(property?.main_image_url || null)
        } finally {
            setUploading(false)
        }
    }

    async function handleAnalyzeImage() {
        if (!property?.id || !preview) return

        try {
            setAnalyzing(true)
            await generateManualFromImage(property.id, preview)
            toast.success('Manual generado y añadido a la guía')
            onSuccess()
        } catch (error: any) {
            toast.error('Error al analizar la imagen: ' + error.message)
        } finally {
            setAnalyzing(false)
        }
    }

    async function onSubmit(values: PropertyFormValues) {
        try {
            setLoading(true)
            if (property) {
                await updateProperty(property.id, values)
                toast.success('Propiedad actualizada')
            } else {
                await createProperty(values)
                toast.success('Propiedad creada')
            }
            onSuccess()
        } catch (error: any) {
            if (error.message === 'SLUG_ALREADY_EXISTS') {
                form.setError('slug', { message: 'Este slug ya está en uso por otra propiedad' })
                toast.error('El slug de la URL ya está en uso')
            } else {
                toast.error('Error al guardar la propiedad: ' + error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del alojamiento</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Ej: Apartamento Centro Madrid"
                                                className="pl-9"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (!property && !slugManuallyEdited) {
                                                        form.setValue('slug', generateSlug(e.target.value))
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL personalizada (Slug)</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">hostguide.app/</span>
                                            <Input
                                                placeholder="casa-asturias"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    setSlugManuallyEdited(true)
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Solo minúsculas, números y guiones.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="full_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ubicación</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ej: Madrid, Centro" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="beds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Habitaciones</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="baths"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Baños</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="guests"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Huéspedes</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FormLabel>Imagen Principal</FormLabel>
                        <div
                            className="relative aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-primary/50 group"
                            onClick={() => !uploading && fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <>
                                    <Image src={preview} alt="Preview" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => !uploading && fileInputRef.current?.click()}>
                                            <Upload className="h-4 w-4" /> Cambiar imagen
                                        </Button>
                                        {property?.id && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                                                disabled={analyzing}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleAnalyzeImage()
                                                }}
                                            >
                                                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                Generar Manual IA
                                            </Button>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setPreview(null)
                                            form.setValue('main_image_url', null)
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 cursor-pointer p-4 text-center">
                                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Subir imagen</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                                    </div>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-sm font-medium">Subiendo...</span>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageUpload}
                                accept="image/*"
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="theme_config.primary_color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color de marca principal</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-9 w-9 rounded-md border border-border shadow-sm"
                                                style={{ backgroundColor: field.value }}
                                            />
                                            <Input type="text" placeholder="#ef4444" {...field} className="font-mono uppercase" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe tu alojamiento..."
                                            className="resize-none min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading || uploading} className="min-w-[140px]">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            property ? 'Actualizar propiedad' : 'Guardar propiedad'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
