'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { revalidatePath } from 'next/cache'

export interface CheckinPropertySettings {
  id: string
  name: string
  ses_establishment_code: string | null
  ses_communication_enabled: boolean
}

export async function getCheckinSettings(): Promise<{ data?: CheckinPropertySettings[]; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings')) {
    return { error: 'No tienes permisos para ver esta configuración' }
  }

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, ses_establishment_code, ses_communication_enabled')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  if (error) return { error: 'No se pudo cargar la configuración' }

  return { data: data as CheckinPropertySettings[] }
}

export async function updatePropertySesSettings(
  propertyId: string,
  input: { ses_establishment_code: string; ses_communication_enabled: boolean }
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings')) {
    return { error: 'No tienes permisos para editar esta configuración' }
  }

  const { error } = await supabase
    .from('properties')
    .update({
      ses_establishment_code: input.ses_establishment_code || null,
      ses_communication_enabled: input.ses_communication_enabled,
    })
    .eq('id', propertyId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: 'No se pudo guardar la configuración' }

  revalidatePath('/dashboard/settings/checkin')
  return { success: true }
}

export interface SesCommunicationLogEntry {
  id: string
  status: string
  guests_count: number
  checkin_date: string
  created_at: string
  response_summary: string | null
  /** Rutas en el bucket privado ses_documents. Null si ya se purgaron. */
  xml_path: string | null
  pdf_path: string | null
  uploaded_at: string | null
  property: { name: string } | null
}

export async function getSesCommunicationsLog(): Promise<{ data?: SesCommunicationLogEntry[]; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'view')) {
    return { error: 'No tienes permisos para ver esta información' }
  }

  const { data, error } = await supabase
    .from('ses_communications')
    .select('id, status, guests_count, checkin_date, created_at, response_summary, xml_path, pdf_path, uploaded_at, property:properties(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: 'No se pudo cargar el historial' }

  return { data: data as unknown as SesCommunicationLogEntry[] }
}

export async function markCommunicationUploaded(id: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings')) {
    return { error: 'No tienes permisos para esta acción' }
  }

  // ses_communications solo tiene policy de LECTURA para el tenant: es el
  // registro de cumplimiento y no debe poder reescribirse desde el cliente.
  // Por eso la escritura va con rol de servicio, pero solo después de haber
  // comprobado sesión, permiso y — abajo — que la fila es de este tenant.
  // Con el cliente del usuario la actualización afectaba a 0 filas y PostgREST
  // no lo considera un error: la pantalla decía "Marcada como subida" sin que
  // hubiera cambiado nada.
  const admin = createServerAdminClient()
  const now = new Date().toISOString()

  const { data: updated, error } = await admin
    .from('ses_communications')
    .update({ status: 'uploaded_manually', uploaded_at: now, updated_at: now })
    .eq('id', id)
    // Sin RLS que proteja, este filtro es lo único que impide tocar la fila
    // de otro tenant: no se puede quitar.
    .eq('tenant_id', profile.tenant_id)
    .select('id')

  if (error) {
    console.error('[checkin-settings] markCommunicationUploaded:', error.message)
    return { error: 'No se pudo actualizar el estado' }
  }

  // Cero filas significa que no existe o que no es de este tenant. Se avisa en
  // vez de dar por hecho el éxito.
  if (!updated?.length) {
    return { error: 'No se encontró la comunicación' }
  }

  revalidatePath('/dashboard/settings/checkin')
  return { success: true }
}

/**
 * Enlace de descarga temporal para el XML o el PDF de una comunicación.
 *
 * El bucket ses_documents es privado y así se queda: estos ficheros llevan
 * documentos de identidad y firmas. En vez de exponerlos, se firma una URL con
 * caducidad corta cada vez que el propietario pulsa descargar, y se comprueba
 * antes que la comunicación es suya.
 */
export async function getSesDocumentUrl(
  communicationId: string,
  kind: 'xml' | 'pdf'
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'view')) {
    return { error: 'No tienes permisos para descargar este documento' }
  }

  // El filtro por tenant es lo que impide pedir el documento de otro.
  const { data: row } = await supabase
    .from('ses_communications')
    .select('xml_path, pdf_path')
    .eq('id', communicationId)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle()

  if (!row) return { error: 'Comunicación no encontrada' }

  const path = kind === 'xml' ? row.xml_path : row.pdf_path
  if (!path) {
    return { error: 'El fichero ya no está disponible: se retiró tras confirmar la subida a SES' }
  }

  // Un minuto basta para que el navegador arranque la descarga y no deja un
  // enlace vivo circulando por el historial.
  const { data, error } = await supabase.storage
    .from('ses_documents')
    .createSignedUrl(path, 60, { download: true })

  if (error || !data?.signedUrl) {
    console.error('[checkin-settings] getSesDocumentUrl:', error?.message)
    return { error: 'No se pudo preparar la descarga' }
  }

  return { url: data.signedUrl }
}
