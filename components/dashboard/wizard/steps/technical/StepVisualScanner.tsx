'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { VisualScanner } from '@/components/guides/VisualScanner'
import { useWizard } from '../../WizardContext'
import { useToast } from '@/hooks/use-toast'

export default function StepVisualScanner({ value }: { value?: string }) {
    const {
        propertyId,
        property,
        setProperty,
        setCompletedSteps
    } = useWizard()
    const { toast } = useToast()

    const effectiveId = propertyId || property?.id || ''

    return (
        <TabsContent value="visual-scanner" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                    <VisualScanner
                        key={effectiveId || 'no-property'}
                        propertyId={effectiveId}
                        onStart={() => {
                            // Phase 1 starting: fast identification
                            setProperty((prev: any) => ({ ...prev, inventory_status: 'identifying' }))
                        }}
                        onSuccess={() => {
                            // Phase 1 done ??? appliances identified ??? Phase 2 running in background
                            setProperty((prev: any) => ({ ...prev, inventory_status: 'generating' }))
                            setCompletedSteps(prev => Array.from(new Set([...prev, 'visual-scanner'])))
                            toast({
                                title: "Aparatos identificados",
                                description: "Los manuales detallados se están generando en segundo plano.",
                            })
                        }}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    )
}
