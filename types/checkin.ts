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
  // Nulos solo en el menor sin documentación: no hay documento que declarar.
  document_type: SesDocumentType | null
  document_number: string | null
  document_support_number: string | null
  first_name: string
  first_surname: string
  second_surname: string | null
  birth_date: string
  nationality: string
  sex: SesSex
  phone: string | null
  email: string | null
  // Un único campo libre: calle, número, piso, puerta. Igual que el
  // "direccion" del esquema de SES, que tampoco separa el número.
  address_street: string
  address_postal_code: string
  address_city: string | null
  address_country: string
  // Código INE (CPRO+CMUN). Solo para residentes en España — es lo que SES
  // exige como codigoMunicipio; para el extranjero va address_city como
  // nombreMunicipio en texto libre.
  address_municipality_code: string | null
  relationship_code: string | null
  signature_url: string | null
}
