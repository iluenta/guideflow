'use client'

import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { LocalRecommendations } from '@/components/guides/LocalRecommendations'
import { useWizard } from '../../WizardContext'

export default function StepDining({ value }: { value?: string }) {
    const { 
        propertyId, 
        property,
        data, 
        setData, 
        aiLoading, 
        handleAIFill 
    } = useWizard()

    const effectiveId = propertyId || property?.id || ''

    return (
        <TabsContent value="dining" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <LocalRecommendations
                propertyId={effectiveId}
                recommendations={data.dining}
                onUpdate={(recs) => setData({ ...data, dining: recs })}
                onAISuggest={(category) => handleAIFill('dining', category)}
                aiLoading={aiLoading === 'dining'}
            />
        </TabsContent>
    )
}
