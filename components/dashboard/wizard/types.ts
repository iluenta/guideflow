export type StepStatus = 'complete' | 'partial' | 'incomplete'

export interface Step {
    id: string
    title: string
    description: string
    icon: string
    status: StepStatus
}

export interface Appliance {
    id: string
    name: string
    brand: string
    model: string
    lastUpdate: string
    status: 'complete' | 'incomplete'
    hasNotes?: boolean
}

export interface Section {
    id: string
    title: string
    description: string
    status: StepStatus
    content?: React.ReactNode
}
