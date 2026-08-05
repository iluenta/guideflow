import { z } from 'zod'

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
    document_type: z.enum(['NIF', 'NIE', 'PAS', 'OTRO']),
    document_number: z.string().trim().min(1, 'Requerido').max(20).transform(v => v.toUpperCase()),
    document_support_number: z.string().trim().max(20).optional(),
    birth_date: z.string().min(1, 'Requerido'),
    nationality: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Código de 3 letras (ej. ESP)').transform(v => v.toUpperCase()),
    sex: z.enum(['H', 'M', 'O']),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email('Email no válido').optional().or(z.literal('')),
    address_street: z.string().trim().min(1, 'Requerido').max(200),
    address_number: z.string().trim().max(20).optional(),
    address_postal_code: z.string().trim().min(1, 'Requerido').max(12),
    address_city: z.string().trim().max(100).optional(),
    address_country: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Código de 3 letras (ej. ESP)').transform(v => v.toUpperCase()),
    relationship_code: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Indica al menos un teléfono o un email' })
    }

    if (data.document_type === 'NIF' && !isValidSpanishNif(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document_number'],
        message: 'DNI no válido (8 dígitos + letra; revisa la letra de control)',
      })
    }
    if (data.document_type === 'NIE' && !isValidSpanishNie(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document_number'],
        message: 'NIE no válido (X/Y/Z + 7 dígitos + letra; revisa la letra de control)',
      })
    }

    if (data.address_country === 'ESP' && !/^\d{5}$/.test(data.address_postal_code.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address_postal_code'], message: 'Código postal español: 5 dígitos' })
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
