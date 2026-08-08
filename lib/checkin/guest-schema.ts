import { z } from 'zod'
import { hasDocument, isDocumentKindAllowed, requiresSupportNumber } from '@/lib/checkin/documents'

// Validación de DNI/NIE español (algoritmo oficial, dígito de control mod 23).
// No es un requisito documentado del "alta masiva" de SES, pero un DNI/NIE con
// la letra de control mal escrita es casi siempre un error de transcripción del
// huésped — mejor pillarlo aquí que al subir el XML al portal.
const DNI_CHECK_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

function isValidSpanishNif(value: string): boolean {
  const v = value.toUpperCase().trim()
  if (!/^\d{8}[A-Z]$/.test(v)) return false
  const number = parseInt(v.slice(0, 8), 10)
  return v[8] === DNI_CHECK_LETTERS[number % 23]
}

function isValidSpanishNie(value: string): boolean {
  const v = value.toUpperCase().trim()
  if (!/^[XYZ]\d{7}[A-Z]$/.test(v)) return false
  const prefixDigit = { X: '0', Y: '1', Z: '2' }[v[0] as 'X' | 'Y' | 'Z']
  const number = parseInt(prefixDigit + v.slice(1, 8), 10)
  return v[8] === DNI_CHECK_LETTERS[number % 23]
}

// Catálogo real TIPO_PARENTESCO (operación "catalogo" de SES Hospedajes, verificado en producción).
export const RELATIONSHIP_OPTIONS = [
  { value: 'AB', label: 'Abuelo/a' },
  { value: 'BA', label: 'Bisabuelo/a' },
  { value: 'BN', label: 'Bisnieto/a' },
  { value: 'CD', label: 'Cuñado/a' },
  { value: 'CY', label: 'Cónyuge' },
  { value: 'HJ', label: 'Hijo/a' },
  { value: 'HR', label: 'Hermano/a' },
  { value: 'NI', label: 'Nieto/a' },
  { value: 'OT', label: 'Otro' },
  { value: 'PM', label: 'Padre o madre' },
  { value: 'SB', label: 'Sobrino/a' },
  { value: 'SG', label: 'Suegro/a' },
  { value: 'TI', label: 'Tío/a' },
  { value: 'TU', label: 'Tutor/a' },
  { value: 'YN', label: 'Yerno o nuera' },
] as const

const RELATIONSHIP_CODES = RELATIONSHIP_OPTIONS.map(o => o.value)

export const guestCheckinSchema = z
  .object({
    first_name: z.string().trim().min(1, 'Requerido').max(100),
    first_surname: z.string().trim().min(1, 'Requerido').max(100),
    second_surname: z.string().trim().max(100).optional(),
    // Lo que elige el huésped, no el código de SES: la traducción vive en
    // lib/checkin/documents.ts (tarjeta y permiso viajan ambos como OTRO, y
    // el menor sin documentación no lleva documento).
    document_kind: z.enum(
      ['DNI', 'NIE', 'PASAPORTE', 'TARJETA_IDENTIDAD', 'PERMISO_RESIDENCIA', 'MENOR_SIN_DOCUMENTO'],
      // Sin esto, quedarse sin elegir (el escaneo no siempre detecta el tipo)
      // enseña el mensaje por defecto de zod, en inglés y con la lista entera
      // de valores internos.
      { errorMap: () => ({ message: 'Selecciona el tipo de documento' }) }
    ),
    // Vacío solo cuando es un menor sin documentación (se comprueba abajo).
    document_number: z.string().trim().max(20).transform(v => v.toUpperCase()),
    document_support_number: z.string().trim().max(20).optional(),
    birth_date: z.string().min(1, 'Requerido'),
    nationality: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Selecciona una nacionalidad').transform(v => v.toUpperCase()),
    sex: z.enum(['H', 'M', 'O']),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email('Email no válido').optional().or(z.literal('')),
    address_street: z.string().trim().min(1, 'Requerido').max(200),
    // Se guarda siempre en mayúsculas: los CP extranjeros son alfanuméricos
    // (Reino Unido, Países Bajos, Canadá…) y SES los espera normalizados.
    address_postal_code: z.string().trim().min(1, 'Requerido').max(12).transform(v => v.toUpperCase()),
    address_city: z.string().trim().max(100).optional(),
    address_country: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Selecciona un país').transform(v => v.toUpperCase()),
    // Código INE de 5 dígitos (CPRO+CMUN). Solo aplica a residentes en España:
    // el "alta masiva" de SES exige codigoMunicipio para el país ESP y solo
    // admite nombreMunicipio en texto libre para el extranjero.
    address_municipality_code: z.string().trim().optional(),
    relationship_code: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Indica al menos un teléfono o un email' })
    }

    // Nacionalidad y tipo de documento están ligados: el DNI lo tiene quien es
    // español, y un extranjero no puede presentar uno. Se revalida aquí porque
    // el desplegable del formulario se puede saltar (acción pública).
    if (!isDocumentKindAllowed(data.document_kind, data.nationality)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document_kind'],
        message: 'Ese documento no corresponde a la nacionalidad indicada',
      })
    }

    if (hasDocument(data.document_kind)) {
      if (!data.document_number) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['document_number'], message: 'Requerido' })
      }

      // El número de soporte es el que llevan impreso el DNI y la tarjeta de
      // extranjero (NIE) y cambia con cada renovación — SES lo usa para saber
      // si el documento presentado sigue vigente. No se exige en pasaporte y
      // demás porque sencillamente no tienen ese número: pedirlo dejaría a
      // cualquier huésped extranjero sin poder terminar el check-in.
      if (requiresSupportNumber(data.document_kind) && !data.document_support_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['document_support_number'],
          message: 'Requerido en DNI y NIE',
        })
      }

      if (data.document_kind === 'DNI' && !isValidSpanishNif(data.document_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['document_number'],
          message: 'DNI no válido (8 dígitos + letra; revisa la letra de control)',
        })
      }
      if (data.document_kind === 'NIE' && !isValidSpanishNie(data.document_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['document_number'],
          message: 'NIE no válido (X/Y/Z + 7 dígitos + letra; revisa la letra de control)',
        })
      }
    } else if (data.document_number) {
      // Coherencia con el CHECK de la tabla: un menor sin documentación no
      // puede arrastrar un número tecleado antes de cambiar de opción.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document_number'],
        message: 'Un menor sin documentación no lleva número de documento',
      })
    }

    // Dirección: España y extranjero se validan distinto porque SES los trata
    // distinto (codigoMunicipio del INE vs nombreMunicipio libre).
    if (data.address_country === 'ESP') {
      if (!/^\d{5}$/.test(data.address_postal_code)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address_postal_code'], message: 'Código postal español: 5 dígitos' })
      }
      if (!/^\d{5}$/.test(data.address_municipality_code ?? '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address_municipality_code'], message: 'Selecciona tu municipio' })
      }
    } else {
      if (!data.address_city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address_city'], message: 'Requerido' })
      }
      // Solo letras mayúsculas y números: sin espacios ni guiones. Normaliza
      // formatos que se escriben de muchas maneras (SW1A 1AA / sw1a-1aa) a uno
      // solo, que es lo que se manda a SES.
      if (!/^[A-Z0-9]+$/.test(data.address_postal_code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address_postal_code'],
          message: 'Solo letras y números, sin espacios ni guiones',
        })
      }
    }

    if (data.phone && !/^[+\d][\d\s-]{5,19}$/.test(data.phone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Teléfono no válido' })
    }

    if (data.relationship_code && !RELATIONSHIP_CODES.includes(data.relationship_code as (typeof RELATIONSHIP_CODES)[number])) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['relationship_code'], message: 'Relación no válida' })
    }

    const birth = new Date(`${data.birth_date}T00:00:00Z`)
    if (Number.isNaN(birth.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birth_date'], message: 'Fecha no válida' })
    } else if (birth.getTime() > Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birth_date'], message: 'La fecha de nacimiento no puede ser futura' })
    } else if (new Date().getUTCFullYear() - birth.getUTCFullYear() > 120) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birth_date'], message: 'Fecha de nacimiento no verosímil' })
    }
  })

export type GuestCheckinFormValues = z.infer<typeof guestCheckinSchema>

/**
 * Datos que normalmente comparten todos los huéspedes de una reserva (pareja,
 * familia…). Se copian del primer huésped a los siguientes para no teclear la
 * misma dirección N veces; siguen siendo editables en cada ficha.
 */
export interface SharedGuestContact {
  phone: string
  email: string
  address_street: string
  address_postal_code: string
  address_city: string
  address_country: string
  address_municipality_code: string
}
