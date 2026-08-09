// Tipos de documento que se le ofrecen al huésped, y su traducción al
// catálogo TIPO_DOCUMENTO de SES Hospedajes.
//
// El catálogo real de SES (consultado en producción con la operación
// "catalogo", solo lectura) tiene exactamente 6 códigos:
//   NIF, NIE, PAS, OTRO ("Otro documento extranjero"), CIF, CIF_E
// CIF y CIF_E son de personas jurídicas: un huésped nunca los usa.
//
// Las opciones que ve el huésped son más específicas que esos códigos
// a propósito — reconoce "permiso de residencia" en su cartera, no "OTRO" —
// así que la elección se guarda aparte (checkin_guests.document_kind) y aquí
// se traduce al código que viaja en el XML.

/** Código del catálogo TIPO_DOCUMENTO de SES. `null` = no hay documento que declarar. */
export type SesDocumentCode = 'NIF' | 'NIE' | 'PAS' | 'OTRO' | null

export type DocumentKind =
  | 'DNI'
  | 'NIE'
  | 'PASAPORTE'
  | 'TARJETA_IDENTIDAD'
  | 'PERMISO_RESIDENCIA'
  | 'MENOR_SIN_DOCUMENTO'

interface DocumentKindDefinition {
  kind: DocumentKind
  label: string
  /** Código que se manda a SES. null en el menor sin documentación. */
  sesCode: SesDocumentCode
  /** El nº de soporte solo está impreso en el DNI y en la tarjeta de extranjero. */
  requiresSupportNumber: boolean
}

const DEFINITIONS: Record<DocumentKind, DocumentKindDefinition> = {
  DNI: { kind: 'DNI', label: 'DNI', sesCode: 'NIF', requiresSupportNumber: true },
  NIE: { kind: 'NIE', label: 'NIE', sesCode: 'NIE', requiresSupportNumber: true },
  PASAPORTE: { kind: 'PASAPORTE', label: 'Pasaporte', sesCode: 'PAS', requiresSupportNumber: false },
  TARJETA_IDENTIDAD: {
    kind: 'TARJETA_IDENTIDAD',
    label: 'Tarjeta de identificación',
    sesCode: 'OTRO',
    requiresSupportNumber: false,
  },
  PERMISO_RESIDENCIA: {
    kind: 'PERMISO_RESIDENCIA',
    label: 'Permiso de residencia extranjero',
    sesCode: 'OTRO',
    requiresSupportNumber: false,
  },
  MENOR_SIN_DOCUMENTO: {
    kind: 'MENOR_SIN_DOCUMENTO',
    label: 'Menor sin documentación',
    sesCode: null,
    requiresSupportNumber: false,
  },
}

// Qué opciones se ofrecen según la NACIONALIDAD (no el país de residencia):
// el DNI lo tiene quien es español, viva donde viva; un extranjero residente
// en España se identifica con NIE, no con DNI.
const KINDS_SPANISH: readonly DocumentKind[] = ['DNI', 'NIE', 'PASAPORTE', 'MENOR_SIN_DOCUMENTO']

const KINDS_FOREIGN: readonly DocumentKind[] = [
  'NIE',
  'PASAPORTE',
  'TARJETA_IDENTIDAD',
  'PERMISO_RESIDENCIA',
  'MENOR_SIN_DOCUMENTO',
]

// Mientras no se sepa la nacionalidad no se restringe nada. Antes se caía en la
// lista de extranjero, que es una suposición sin fundamento y además tenía un
// efecto feo: al escanear un DNI cuyo MRZ no dejaba leer la nacionalidad, el
// tipo de documento se descartaba en silencio por "no válido" y el huésped veía
// el desplegable vacío y sin la opción DNI.
const KINDS_UNKNOWN: readonly DocumentKind[] = [
  'DNI',
  'NIE',
  'PASAPORTE',
  'TARJETA_IDENTIDAD',
  'PERMISO_RESIDENCIA',
  'MENOR_SIN_DOCUMENTO',
]

export function documentKindsForNationality(nationality: string): DocumentKindDefinition[] {
  const code = nationality.trim().toUpperCase()
  const kinds = !code ? KINDS_UNKNOWN : code === 'ESP' ? KINDS_SPANISH : KINDS_FOREIGN
  return kinds.map(k => DEFINITIONS[k])
}

export function isDocumentKindAllowed(kind: string, nationality: string): boolean {
  return documentKindsForNationality(nationality).some(d => d.kind === kind)
}

export function sesCodeForKind(kind: DocumentKind): SesDocumentCode {
  return DEFINITIONS[kind].sesCode
}

export function requiresSupportNumber(kind: DocumentKind): boolean {
  return DEFINITIONS[kind].requiresSupportNumber
}

export function hasDocument(kind: DocumentKind): boolean {
  return kind !== 'MENOR_SIN_DOCUMENTO'
}

export function documentKindLabel(kind: DocumentKind): string {
  return DEFINITIONS[kind].label
}

export const ALL_DOCUMENT_KINDS = Object.keys(DEFINITIONS) as DocumentKind[]

/**
 * Traduce el código de SES guardado en fichas antiguas a la opción del
 * formulario. OTRO cae en tarjeta de identificación porque es el caso
 * corriente y en el XML ambas vuelven a salir como OTRO.
 */
export function kindFromSesCode(code: string | null): DocumentKind {
  switch (code) {
    case 'NIF':
      return 'DNI'
    case 'NIE':
      return 'NIE'
    case 'PAS':
      return 'PASAPORTE'
    case null:
      return 'MENOR_SIN_DOCUMENTO'
    default:
      return 'TARJETA_IDENTIDAD'
  }
}
