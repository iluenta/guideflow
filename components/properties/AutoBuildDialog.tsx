'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ingestPropertyData } from '@/app/actions/ai-ingestion'
import { toast } from 'sonner'

interface AutoBuildDialogProps {
    propertyId: string
    onComplete: () => void
}

export function AutoBuildDialog({ propertyId, onComplete }: AutoBuildDialogProps) {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'input' | 'confirm' | 'progress' | 'done'>('input')
    const [progressMsg, setProgressMsg] = useState('')

    async function handleStartIngetion(overwrite = false) {
        if (!url) return

        setLoading(true)
        setStep('progress')
        setProgressMsg('Accediendo al anuncio...')

        try {
            const result = await ingestPropertyData(propertyId, url, { overwrite })

            if (result.requiresConfirmation) {
                setStep('confirm')
                return
            }

            setStep('done')
            toast.success('¡Guía generada con éxito!')
            setTimeout(() => {
                setOpen(false)
                onComplete()
            }, 2000)

        } catch (error: any) {
            toast.error(error.message || 'Error al generar la guía')
            setStep('input')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) setStep('input')
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Sparkles className="h-4 w-4" />
                    Auto-Build con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Ingesta Inteligente
                    </DialogTitle>
                    <DialogDescription>
                        Pega la URL de Airbnb o Booking para que la IA construya tu guía automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'input' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Link del anuncio</label>
                                <Input
                                    placeholder="https://www.airbnb.com/rooms/..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                La IA extraerá descripción, normas, servicios y FAQs automáticamente.
                            </p>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-4 rounded-lg bg-amber-50 p-4 border border-amber-200">
                            <div className="flex gap-3 text-amber-700">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">¿Sobreescribir guía existente?</p>
                                    <p className="text-xs">
                                        Esta propiedad ya tiene secciones creadas. Si continúas, la IA las reemplazará todas por la nueva información.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'progress' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">{progressMsg}</p>
                                <p className="text-xs text-muted-foreground animate-pulse">
                                    Esto suele tardar unos 15-20 segundos...
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-green-600" />
                            </div>
                            <p className="font-semibold text-green-700">¡Todo listo!</p>
                            <p className="text-sm text-muted-foreground">Tu guía ha sido generada y organizada.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 'input' && (
                        <Button onClick={() => handleStartIngetion(false)} disabled={!url || loading} className="w-full">
                            Empezar Auto-Build
                        </Button>
                    )}
                    {step === 'confirm' && (
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button variant="outline" onClick={() => setStep('input')}>Cancelar</Button>
                            <Button variant="destructive" onClick={() => handleStartIngetion(true)}>Sobreescribir</Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
