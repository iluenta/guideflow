// Wizard types and interfaces

export type WizardStep =
  | 'welcome'
  | 'property'
  | 'appearance'
  | 'access'
  | 'checkin'
  | 'rules'
  | 'faqs'
  | 'contacts'
  | 'dining'
  | 'inventory'
  | 'tech'
  | 'manuals'
  | 'visual-scanner'

export interface WizardSection {
  id: string
  title: string
  description: string
  icon: string
  steps: WizardStep[]
  completed: boolean
}

export interface WizardProgress {
  currentStep: WizardStep
  completedSteps: WizardStep[]
  totalSteps: number
  percentComplete: number
}

export interface WizardContext {
  propertyId: string
  tenantId: string
  progress: WizardProgress
  sections: WizardSection[]
}

// Step-specific data types
export interface PropertyStepData {
  name: string
  address: string
  description?: string
}

export interface AppearanceStepData {
  primaryColor: string
  secondaryColor: string
  theme: 'light' | 'dark' | 'auto'
  logo?: string
}

export interface AccessStepData {
  checkInTime: string
  checkOutTime: string
  accessInstructions: string
  parkingInfo?: string
}

export interface ContactsStepData {
  emergencyContact: string
  emergencyPhone: string
  hostName: string
  hostPhone: string
  hostEmail: string
  cleaningService?: string
  maintenanceService?: string
}

export interface InventoryStepData {
  items: InventoryItem[]
  scannedAt?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}
