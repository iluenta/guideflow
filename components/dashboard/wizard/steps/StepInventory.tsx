'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Loader2, Sparkles } from 'lucide-react'
import { InventorySelector } from '@/components/dashboard/InventorySelector'
import { useWizard } from '../WizardContext'

export default function StepInventory({ value }: { value?: string }) {
    const { 
        data, 
        setData, 
        property 
    } = useWizard()

    return (
        <TabsContent value="inventory" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <div>
                        <CardTitle className="text-base">Inventario y Dotación</CardTitle>
                        <CardDescription className="text-xs">Selecciona lo que tienes disponible para que la IA pueda guiar a tus huéspedes.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {/* Status-aware banner */}
                    {property?.inventory_status === 'identifying' && (
                        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in duration-300">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-blue-900">Identificando aparatos...</p>
                                <p className="text-xs text-blue-700">Analizando las fotos con IA. En unos segundos se actualizará el inventario.</p>
                            </div>
                        </div>
                    )}
                    {property?.inventory_status === 'generating' && (
                        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in duration-300">
                            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-900">Inventario actualizado ✨</p>
                                <p className="text-xs text-amber-700">Los manuales técnicos se están generando en segundo plano. Puedes continuar con la configuración.</p>
                            </div>
                        </div>
                    )}
                    <InventorySelector
                        items={data.inventory?.selected_items || []}
                        existingManuals={property?.manuals || []}
                        onChange={(items) => setData({ ...data, inventory: { ...data.inventory, selected_items: items } })}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    )
}
