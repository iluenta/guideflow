'use client'

import React from 'react'
import { WizardProvider } from './wizard/WizardContext'
import { WizardLayout } from './wizard/WizardLayout'
import StepProperty from './wizard/steps/property/StepProperty'
import StepAppearance from './wizard/steps/property/StepAppearance'
import StepAccess from './wizard/steps/access/StepAccess'
import StepWelcome from './wizard/steps/content/StepWelcome'
import StepContacts from './wizard/steps/local/StepContacts'
import StepCheckin from './wizard/steps/access/StepCheckin'
import StepRules from './wizard/steps/content/StepRules'
import StepTech from './wizard/steps/technical/StepTech'
import StepVisualScanner from './wizard/steps/technical/StepVisualScanner'
import { StepApplianceManuals } from './wizard/steps/technical/StepApplianceManuals'
import StepInventory from './wizard/steps/technical/StepInventory'
import StepDining from './wizard/steps/local/StepDining'
import StepFaqs from './wizard/steps/content/StepFaqs'

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
                <StepApplianceManuals value="appliance-manuals" />
                <StepInventory value="inventory" />
                <StepDining value="dining" />
                <StepFaqs value="faqs" />
            </WizardLayout>
        </WizardProvider>
    )
}