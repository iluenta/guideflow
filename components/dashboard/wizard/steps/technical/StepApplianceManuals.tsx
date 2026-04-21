'use client'

import React, { useState } from 'react'
import { useWizard } from '../../WizardContext'
import { ManualsSection } from '../../sections/ManualsSection'
import { matchesInventoryItem } from '@/components/dashboard/InventorySelector'
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
import { saveWizardStep } from '@/app/actions/wizard'
import { regenerateManualAction } from '@/app/actions/ai-ingestion'
import { toast } from 'sonner'

export function StepApplianceManuals({ value }: { value?: string }) {
    const { property, setProperty, data, setData } = useWizard()
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    if (!property) return null

    const manuals = property.manuals || []
    const isGenerating = property?.inventory_status === 'generating' || property?.inventory_status === 'identifying'

    const handleDelete = async () => {
        if (!confirmDeleteId) return
        
        const idToDelete = confirmDeleteId
        const previousManuals = [...manuals]
        const previousInventory = data.inventory?.selected_items || []
        
        // Find the manual to delete to get its name for inventory sync
        const manualToDelete = manuals.find((m: any) => m.id === idToDelete)
        const manualName = manualToDelete?.appliance_name
        
        // Optimistic update: remove from UI immediately
        setProperty({
            ...property,
            manuals: manuals.filter((m: any) => m.id !== idToDelete)
        })

        // SYNC: If deleting a manual, update the inventory selection to keep it consistent
        if (manualName) {
            const updatedInventory = previousInventory.map((item: any) => {
                // If it matches the manual being deleted and was marked present, uncheck it
                // ONLY if the manual being deleted is what likely prompted its presence
                if (item.isPresent && matchesInventoryItem(manualName, item)) {
                    return { ...item, isPresent: false }
                }
                return item
            })
            
            // Only update and persist if changes were made
            if (JSON.stringify(updatedInventory) !== JSON.stringify(previousInventory)) {
                setData((prev: any) => ({
                    ...prev,
                    inventory: { ...prev.inventory, selected_items: updatedInventory }
                }))

                // PERSIST: Save the inventory change to the database immediately
                try {
                    await saveWizardStep('inventory', { selected_items: updatedInventory }, property.id, property.tenant_id)
                } catch (err) {
                    console.error('[SYNC] Failed to persist inventory update:', err)
                    // We don't revert here because the manual itself is already being deleted
                }
            }
        }

        setConfirmDeleteId(null)

        try {
            await deleteManual(idToDelete, property.id)
            toast.success('Manual eliminado')
        } catch (error) {
            // Revert state if server call fails
            setProperty({
                ...property,
                manuals: previousManuals
            })
            setData((prev: any) => ({
                ...prev,
                inventory: { ...prev.inventory, selected_items: previousInventory }
            }))
            toast.error('Error al eliminar manual')
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

    const handleRegenerate = async (manual: any): Promise<string | void> => {
        if (!property) return
        const toastId = toast.loading('Regenerando manual con IA...')
        try {
            const result = await regenerateManualAction(manual.id)
            if (result.success) {
                const updatedManuals = manuals.map((m: any) =>
                    m.id === manual.id ? { ...m, manual_content: result.content } : m
                )
                setProperty({ ...property, manuals: updatedManuals })
                toast.success('Manual regenerado correctamente', { id: toastId })
                return result.content
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
                isGenerating={isGenerating}
                onDelete={(id: string) => setConfirmDeleteId(id)}
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
