'use client'

import React from 'react'
import { WizardProvider } from './wizard/WizardContext'
import { WizardLayout } from './wizard/WizardLayout'
import StepProperty from './wizard/steps/StepProperty'
import StepAppearance from './wizard/steps/StepAppearance'
import StepAccess from './wizard/steps/StepAccess'
import StepWelcome from './wizard/steps/StepWelcome'
import StepContacts from './wizard/steps/StepContacts'
import StepCheckin from './wizard/steps/StepCheckin'
import StepRules from './wizard/steps/StepRules'
import StepTech from './wizard/steps/StepTech'
import StepVisualScanner from './wizard/steps/StepVisualScanner'
import StepInventory from './wizard/steps/StepInventory'
import StepDining from './wizard/steps/StepDining'
import StepFaqs from './wizard/steps/StepFaqs'

interface PropertySetupWizardProps {
    propertyId?: string // Opcional para creación
    tenantId?: string   // Requerido para creación
    onSuccess?: (id: string) => void
}

/**
 * PropertySetupWizard - Orchestrator Component
 * 
 * Provides the WizardContext to all its children and renders the layout
 * with all the individual step components.
 */
export function PropertySetupWizard({ propertyId, tenantId, onSuccess }: PropertySetupWizardProps) {
    return (
        <WizardProvider initialPropertyId={propertyId} tenantId={tenantId} onSuccess={onSuccess}>
            <WizardLayout>
                <StepProperty value="property" />
                <StepAppearance value="appearance" />
                <StepAccess value="access" />
                <StepWelcome value="welcome" />
                <StepContacts value="contacts" />
                <StepCheckin value="checkin" />
                <StepRules value="rules" />
                <StepTech value="tech" />
                <StepVisualScanner value="visual-scanner" />
                <StepInventory value="inventory" />
                <StepDining value="dining" />
                <StepFaqs value="faqs" />
            </WizardLayout>
        </WizardProvider>
    )
}