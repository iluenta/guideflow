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
import { FileEdit, Loader2, Save } from 'lucide-react'
import { updateManualContent } from '@/app/actions/properties'
import { toast } from 'sonner'

interface ManualEditDialogProps {
    manual: {
        id: string
        appliance_name: string
        manual_content: string
    }
    propertyId: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ManualEditDialog({
    manual,
    propertyId,
    isOpen,
    onOpenChange,
    onSuccess
}: ManualEditDialogProps) {
    const [content, setContent] = useState(manual.manual_content)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error('El contenido no puede estar vacío.')
            return
        }

        setIsSaving(true)
        try {
            await updateManualContent(manual.id, propertyId, content)
            toast.success('Manual actualizado correctamente.')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error('Error al actualizar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col rounded-[2.5rem] p-8 overflow-hidden">
                <DialogHeader className="mb-4 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FileEdit className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Editor de Manual</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">
                        Editando: {manual.appliance_name}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium pt-1">
                        Modifica directamente el contenido del manual técnico en formato Markdown.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 py-4 flex flex-col space-y-3">
                    <Label htmlFor="manual-content" className="text-sm font-bold text-slate-700 ml-1">
                        Contenido del Manual (Markdown)
                    </Label>
                    <Textarea
                        id="manual-content"
                        placeholder="Escribe el contenido aquí..."
                        className="flex-1 font-mono text-sm leading-relaxed rounded-2xl border-slate-200 focus:ring-primary/20 bg-slate-50/30 p-5 resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isSaving}
                    />
                </div>

                <DialogFooter className="flex flex-row gap-3 mt-6 shrink-0">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl h-12 font-bold text-slate-400 hover:text-slate-600"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="flex-[2] rounded-2xl h-12 font-bold gap-2 bg-slate-900 hover:bg-black shadow-xl"
                        onClick={handleSave}
                        disabled={isSaving || content === manual.manual_content}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
