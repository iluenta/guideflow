'use client'

import React, { useState } from 'react'
import { useWizard } from '../WizardContext'
import { ManualsSection } from '../sections/ManualsSection'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteManual, saveManual } from '@/app/actions/properties'
import { regenerateManualAction } from '@/app/actions/ai-ingestion'
import { toast } from 'sonner'

export function StepApplianceManuals() {
    const { property, setProperty } = useWizard()
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    if (!property) return null

    const manuals = property.manuals || []

    const handleDelete = async () => {
        if (!confirmDeleteId) return
        try {
            await deleteManual(confirmDeleteId, property.id)
            setProperty({
                ...property,
                manuals: manuals.filter((m: any) => m.id !== confirmDeleteId)
            })
            toast.success('Manual eliminado')
        } catch (error) {
            toast.error('Error al eliminar manual')
        } finally {
            setConfirmDeleteId(null)
        }
    }

    const handleSave = async (id: string, updates: { manual_content: string, notes: string }) => {
        if (!property) return
        try {
            await saveManual(id, property.id, {
                manual_content: updates.manual_content,
                notes: updates.notes,
                is_revised: true // Mark as revised when saved from here as per mockup ("Guardar y Aprobar")
            })

            // Update local state to avoid reload
            const updatedManuals = manuals.map((m: any) => {
                if (m.id === id) {
                    return {
                        ...m,
                        manual_content: updates.manual_content,
                        metadata: {
                            ...m.metadata,
                            notes: updates.notes,
                            is_revised: true,
                            status: 'reviewed'
                        }
                    }
                }
                return m
            })

            setProperty({ ...property, manuals: updatedManuals })
            toast.success('Manual guardado y aprobado')
        } catch (error) {
            console.error('Error saving manual:', error)
            toast.error('Error al guardar el manual')
            throw error
        }
    }

    const handleRegenerate = async (manual: any) => {
        if (!property) return
        const toastId = toast.loading('Regenerando manual con IA...')
        try {
            const result = await regenerateManualAction(manual.id)
            if (result.success) {
                // Update local state
                const updatedManuals = manuals.map((m: any) => {
                    if (m.id === manual.id) {
                        return { ...m, manual_content: result.content }
                    }
                    return m
                })
                setProperty({ ...property, manuals: updatedManuals })
                toast.success('Manual regenerado correctamente', { id: toastId })
            }
        } catch (error) {
            console.error('Error regenerating manual:', error)
            toast.error('Error al regenerar el manual', { id: toastId })
            throw error
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <ManualsSection
                manuals={manuals}
                onDelete={(id) => setConfirmDeleteId(id)}
                onSave={handleSave}
                onRegenerate={handleRegenerate}
            />

            <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar manual?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el manual y la IA dejará de responder preguntas sobre este aparato.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 rounded-xl">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
