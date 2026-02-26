'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Package } from 'lucide-react'
import { InventorySelector } from '../InventorySelector'

interface StepInventoryProps {
    data: any
    onChange: (data: any) => void
    onAIFill: () => void
    aiLoading: boolean
}

export function StepInventory({ data, onChange, onAIFill, aiLoading }: StepInventoryProps) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-serif text-text-primary">Inventario y Equipamiento</CardTitle>
                <CardDescription>Selecciona los electrodomésticos y servicios disponibles.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-bold">Detección Inteligente</span>
                        </div>
                        <p className="text-sm text-text-secondary pr-4">Podemos analizar tus fotos y descripción para sugerir el equipamiento automáticamente.</p>
                    </div>
                    <Button onClick={onAIFill} disabled={aiLoading} className="bg-primary hover:bg-primary-hover gap-2 shrink-0">
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Analizar con IA
                    </Button>
                </div>

                <InventorySelector 
                    items={Array.isArray(data) ? data : (data?.items || data?.inventory || [])} 
                    onChange={onChange} 
                />
            </CardContent>
        </Card>
    )
}
