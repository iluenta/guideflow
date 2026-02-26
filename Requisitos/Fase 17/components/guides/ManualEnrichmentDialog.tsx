'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, Info } from 'lucide-react'
import { enrichManualWithHostNotes } from '@/app/actions/manual-enrichment'
import { toast } from 'sonner'

interface ManualEnrichmentDialogProps {
    manual: {
        id: string
        appliance_name: string
        brand: string
        model: string
    }
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ManualEnrichmentDialog({
    manual,
    isOpen,
    onOpenChange,
    onSuccess
}: ManualEnrichmentDialogProps) {
    const [hostNotes, setHostNotes] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleEnrich = async () => {
        if (!hostNotes.trim()) {
            toast.error('Por favor, escribe algunas notas antes de continuar.')
            return
        }

        setIsProcessing(true)
        try {
            await enrichManualWithHostNotes(manual.id, hostNotes)
            toast.success('Manual enriquecido correctamente. La IA ya conoce tus notas.')
            onSuccess()
            onOpenChange(false)
            setHostNotes('')
        } catch (error: any) {
            toast.error('Error al enriquecer manual: ' + error.message)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8 md:p-12 overflow-hidden">
                <DialogHeader className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">IA x Host</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">
                        Personalizar Manual: {manual.appliance_name}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium pt-1">
                        Añade detalles específicos que solo tú conoces. La IA los integrará en el manual técnico.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700 leading-relaxed">
                            <strong>Ejemplos:</strong> "El botón de encendido está un poco suelto, apretar fuerte", "Usar solo detergente líquido", "El mando de la derecha no funciona".
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="notes" className="text-sm font-bold text-slate-700 ml-1">
                            Tus Notas de Anfitrión
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Escribe aquí las instrucciones o trucos específicos para este aparato..."
                            className="min-h-[180px] rounded-2xl border-slate-200 focus:ring-primary/20 bg-slate-50/30 p-5 text-base leading-relaxed"
                            value={hostNotes}
                            onChange={(e) => setHostNotes(e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>
                </div>

                <DialogFooter className="flex flex-row gap-3 mt-8">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl h-12 font-bold text-slate-400 hover:text-slate-600"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="flex-[2] rounded-2xl h-12 font-bold gap-2 bg-slate-900 hover:bg-black shadow-xl shadow-slate-200"
                        onClick={handleEnrich}
                        disabled={isProcessing || !hostNotes.trim()}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Fusionando con IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Enriquecer Manual
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
