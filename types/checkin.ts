// Tipos para el módulo de check-in online / SES Hospedajes

// Catálogos reales de SES Hospedajes (confirmados vía operación "catalogo" en producción)
export type SesDocumentType = 'NIF' | 'NIE' | 'PAS' | 'CIF' | 'CIF_E' | 'OTRO'
export type SesSex = 'H' | 'M' | 'O'

export interface ExtractedGuestDocumentData {
  first_name: string | null
  first_surname: string | null
  second_surname: string | null
  document_type: SesDocumentType | null
  document_number: string | null
  document_support_number: string | null
  birth_date: string | null // YYYY-MM-DD
  nationality: string | null // ISO 3166-1 alpha-3
  sex: SesSex | null
  confidence: 'high' | 'medium' | 'low'
}

// Fila real de la tabla checkin_guests (lo que necesita el generador de XML/PDF)
export interface CheckinGuestRecord {
  guest_order: number
  document_type: SesDocumentType
  document_number: string
  document_support_number: string | null
  first_name: string
  first_surname: string
  second_surname: string | null
  birth_date: string
  nationality: string
  sex: SesSex
  phone: string | null
  email: string | null
  address_street: string
  address_number: string | null
  address_postal_code: string
  address_city: string | null
  address_country: string
  relationship_code: string | null
  signature_url: string | null
}
