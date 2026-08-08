'use server'

import { createServerAdminClient } from '@/lib/supabase/server-admin'

// Catálogo de municipios del INE. Lo consulta el formulario de check-in, que
// es público y anónimo: SES Hospedajes exige codigoMunicipio (código INE de
// 5 dígitos) cuando el país de residencia es España, y ese código no se puede
// deducir del código postal (Adra = 04770/04778/04779).
//
// Todo se resuelve contra nuestra propia base de datos: ninguna llamada a
// servicios externos en el camino crítico del check-in del huésped. El
// catálogo se refresca con scripts/import-ine-municipalities.mjs.

export interface Province {
  code: string
  name: string
}

export interface Municipality {
  code: string
  name: string
}

// Cliente admin porque quien llama es un visitante anónimo. La tabla tiene
// policy de lectura pública igualmente — es un catálogo del INE, sin PII —
// pero se usa el mismo patrón que el resto de acciones públicas de check-in.
export async function getProvinces(): Promise<{ data: Province[]; error?: string }> {
  const admin = createServerAdminClient()

  const { data, error } = await admin
    .from('ine_provinces')
    .select('code, name')
    .order('name')

  if (error) {
    console.error('[municipalities] getProvinces:', error.message)
    return { data: [], error: 'No se pudo cargar la lista de provincias' }
  }

  return { data: data ?? [] }
}

/**
 * Municipios de una provincia (la mayor, Burgos, tiene 371 — cabe de sobra en
 * una respuesta). El filtrado por texto lo hace el cliente sobre esta lista,
 * así que escribir en el buscador no dispara peticiones.
 */
export async function getMunicipalities(
  provinceCode: string
): Promise<{ data: Municipality[]; error?: string }> {
  if (!/^\d{2}$/.test(provinceCode)) {
    return { data: [], error: 'Provincia no válida' }
  }

  const admin = createServerAdminClient()

  const { data, error } = await admin
    .from('ine_municipalities')
    .select('code, name')
    .eq('province_code', provinceCode)
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('[municipalities] getMunicipalities:', error.message)
    return { data: [], error: 'No se pudo cargar la lista de municipios' }
  }

  return { data: data ?? [] }
}

/**
 * Comprueba que un código existe en el catálogo y devuelve su nombre.
 * La usa submitCheckinGuest para no fiarse de lo que manda el cliente: un
 * código inventado acabaría en el XML de SES y lo rechazaría el portal.
 * Se aceptan municipios inactivos (fusionados): si una ficha se guardó con
 * ese código, reabrirla y reenviarla no debe fallar.
 */
export async function resolveMunicipality(
  code: string
): Promise<{ code: string; name: string } | null> {
  if (!/^\d{5}$/.test(code)) return null

  const admin = createServerAdminClient()

  const { data } = await admin
    .from('ine_municipalities')
    .select('code, name')
    .eq('code', code)
    .maybeSingle()

  return data ?? null
}
