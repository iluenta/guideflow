// API Request/Response types

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

// Chat API
export interface ChatRequest {
  message: string
  propertyId: string
  conversationId?: string
}

export interface ChatResponse {
  response: string
  conversationId: string
  sources?: string[]
}

// Translation API
export interface TranslationRequest {
  text: string
  targetLang: string
  sourceLang?: string
  propertyId: string
}

export interface TranslationResponse {
  translated: string
  cacheHit: boolean
  translationTimeMs: number
}

// Property API
export interface PropertyCreateRequest {
  name: string
  address: string
  tenantId: string
}

export interface PropertyUpdateRequest {
  name?: string
  address?: string
  status?: 'active' | 'inactive' | 'draft'
}

// Guest Access API
export interface GuestAccessRequest {
  propertyId: string
  email?: string
  expiresAt?: string
}

export interface GuestAccessResponse {
  token: string
  accessUrl: string
  expiresAt: string
}

// AI Ingestion API
export interface AIIngestionRequest {
  propertyId: string
  listingUrl?: string
  notes?: string
}

export interface AIIngestionResponse {
  success: boolean
  sectionsCreated: number
  processingTimeMs: number
}

// Wizard API
export interface WizardStepData {
  step: string
  data: Record<string, unknown>
  propertyId: string
}

export interface WizardCompleteRequest {
  propertyId: string
  completedSteps: string[]
}
