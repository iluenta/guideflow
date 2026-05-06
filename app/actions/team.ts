'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { can, type TenantRole } from '@/lib/permissions'
import { getLimit, type PackageLevel } from '@/lib/entitlements'
import { sendInvitationEmail } from '@/lib/services/invitation-email'
import { requireProfile } from '@/lib/supabase/get-tenant-id'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  email: string
  full_name: string | null
  tenant_role: TenantRole
  avatar_url: string | null
  created_at: string
}

export interface PendingInvitation {
  id: string
  email: string
  tenant_role: TenantRole
  created_at: string
  expires_at: string
  email_sent_at: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTenant(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id, name, package_level')
    .eq('id', tenantId)
    .single()
  return data
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getTeamMembers(): Promise<{
  members: TeamMember[]
  invitations: PendingInvitation[]
  error?: string
}> {
  const supabase = await createClient()
  let profile;
  try {
    profile = await requireProfile(supabase)
  } catch (e: any) {
    return { members: [], invitations: [], error: e.message }
  }

  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, email, full_name, tenant_role, avatar_url, created_at')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: true })

  if (membersError) return { members: [], invitations: [], error: 'Error al cargar miembros' }

  const { data: invitations } = await supabase
    .from('tenant_invitations')
    .select('id, email, tenant_role, created_at, expires_at, email_sent_at')
    .eq('tenant_id', profile.tenant_id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return {
    members: (members ?? []) as TeamMember[],
    invitations: (invitations ?? []) as PendingInvitation[],
  }
}

export async function inviteMember(
  email: string,
  tenantRole: 'admin' | 'support' | 'viewer',
  _message?: string
): Promise<{ success?: boolean; emailFailed?: boolean; link?: string; error?: string }> {
  const supabase = await createClient()
  let profile;
  try {
    profile = await requireProfile(supabase)
  } catch (e: any) {
    return { error: e.message }
  }

  if (!can(profile.tenant_role as TenantRole, 'members', 'invite')) {
    return { error: 'No tienes permisos para invitar miembros' }
  }

  const tenant = await getTenant(profile.tenant_id)
  if (!tenant) return { error: 'Tenant no encontrado' }

  // Verificar límite de miembros del plan
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)

  const limit = getLimit(tenant.package_level as PackageLevel, 'max_team_members')
  if ((count ?? 0) >= limit) {
    return {
      error: `Tu plan ${tenant.package_level} permite hasta ${limit} miembros. Actualiza tu plan para añadir más.`,
    }
  }

  // Verificar si ya hay una invitación pendiente para este email en este tenant
  const { data: existing } = await supabase
    .from('tenant_invitations')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('email', email.toLowerCase())
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existing) {
    return { error: 'Ya existe una invitación pendiente para este email' }
  }

  // Crear invitación con el admin client (bypass RLS para INSERT seguro con tenant_id del caller)
  const adminClient = createServerAdminClient()
  const { data: invitation, error: insertError } = await adminClient
    .from('tenant_invitations')
    .insert({
      tenant_id: profile.tenant_id,
      email: email.toLowerCase(),
      tenant_role: tenantRole,
      invited_by: profile.id,
    })
    .select('id, token')
    .single()

  if (insertError || !invitation) {
    return { error: 'Error al crear la invitación' }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const acceptLink = `${siteUrl}/accept-invitation?token=${invitation.token}`

  // Intentar enviar email — no revertir si falla
  try {
    const inviterName = profile.email.split('@')[0]
    await sendInvitationEmail({
      to: email,
      inviterName,
      tenantName: tenant.name,
      tenantRole,
      token: invitation.token,
    })

    await adminClient
      .from('tenant_invitations')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return { success: true }
  } catch {
    return { success: true, emailFailed: true, link: acceptLink }
  }
}

export async function resendInvitation(
  invitationId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  let profile;
  try {
    profile = await requireProfile(supabase)
  } catch (e: any) {
    return { error: e.message }
  }

  if (!can(profile.tenant_role as TenantRole, 'members', 'invite')) {
    return { error: 'No tienes permisos para reenviar invitaciones' }
  }

  const { data: invitation } = await supabase
    .from('tenant_invitations')
    .select('id, email, tenant_role, token, expires_at, tenant_id')
    .eq('id', invitationId)
    .eq('tenant_id', profile.tenant_id)
    .is('accepted_at', null)
    .single()

  if (!invitation) return { error: 'Invitación no encontrada' }
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'La invitación ha expirado. Crea una nueva.' }
  }

  const tenant = await getTenant(profile.tenant_id)
  if (!tenant) return { error: 'Tenant no encontrado' }

  const adminClient = createServerAdminClient()

  try {
    const inviterName = profile.email.split('@')[0]
    await sendInvitationEmail({
      to: invitation.email,
      inviterName,
      tenantName: tenant.name,
      tenantRole: invitation.tenant_role,
      token: invitation.token,
    })

    await adminClient
      .from('tenant_invitations')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return { success: true }
  } catch {
    return { error: 'No se pudo enviar el email' }
  }
}

export async function updateMemberRole(
  memberId: string,
  newRole: 'admin' | 'support' | 'viewer'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  let profile;
  try {
    profile = await requireProfile(supabase)
  } catch (e: any) {
    return { error: e.message }
  }

  if (!can(profile.tenant_role as TenantRole, 'members', 'edit')) {
    return { error: 'No tienes permisos para editar roles' }
  }

  // No puede auto-degradarse
  if (memberId === profile.id) {
    return { error: 'No puedes cambiar tu propio rol' }
  }

  const adminClient = createServerAdminClient()

  // Verificar que el miembro pertenece al mismo tenant
  const { data: target } = await adminClient
    .from('profiles')
    .select('id, tenant_role, tenant_id')
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!target) return { error: 'Miembro no encontrado' }
  if (target.tenant_role === 'owner') {
    return { error: 'No se puede cambiar el rol del propietario' }
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ tenant_role: newRole })
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: 'Error al actualizar el rol' }
  return { success: true }
}

export async function removeMember(
  memberId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  let profile;
  try {
    profile = await requireProfile(supabase)
  } catch (e: any) {
    return { error: e.message }
  }

  if (!can(profile.tenant_role as TenantRole, 'members', 'remove')) {
    return { error: 'No tienes permisos para eliminar miembros' }
  }

  if (memberId === profile.id) {
    return { error: 'No puedes eliminarte a ti mismo' }
  }

  const adminClient = createServerAdminClient()

  const { data: target } = await adminClient
    .from('profiles')
    .select('id, tenant_role, tenant_id')
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!target) return { error: 'Miembro no encontrado' }
  if (target.tenant_role === 'owner') {
    return { error: 'No se puede eliminar al propietario' }
  }

  const { error } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: 'Error al eliminar el miembro' }
  return { success: true }
}

export async function getInvitationByToken(token: string) {
  const adminClient = createServerAdminClient()
  const { data } = await adminClient
    .from('tenant_invitations')
    .select('id, tenant_id, email, tenant_role, expires_at, accepted_at')
    .eq('token', token)
    .single()
  return data ?? null
}

export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success?: boolean; tenant_id?: string; error?: string }> {
  const adminClient = createServerAdminClient()

  // 1. Obtener invitación
  const invitation = await getInvitationByToken(token)
  if (!invitation) {
    return { error: 'Invitación no válida o no encontrada' }
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'La invitación ha expirado. Solicita una nueva al administrador del espacio.' }
  }
  if (invitation.accepted_at) {
    return { error: 'Esta invitación ya fue aceptada anteriormente.' }
  }

  // 2. Verificar que el email del usuario coincide
  const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId)
  if (userError || !user) {
    return { error: 'No se pudo verificar tu cuenta' }
  }
  if ((user.email ?? '').toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: 'Esta invitación es para otro email. Inicia sesión con la cuenta correcta.' }
  }

  // 3. Comprobar si el usuario ya tiene perfil
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, tenant_id')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    if (existingProfile.tenant_id !== invitation.tenant_id) {
      return {
        error:
          'Este usuario ya pertenece a otro espacio en Hospyia. Contacta con soporte si necesitas cambiar de espacio.',
      }
    }
    return { error: 'Ya perteneces a este espacio de trabajo.' }
  }

  // 4. Crear perfil en el tenant de la invitación
  const { error: insertError } = await adminClient.from('profiles').insert({
    id: userId,
    email: user.email!,
    full_name: (user.user_metadata?.full_name as string) ?? null,
    tenant_id: invitation.tenant_id,
    role: 'user',
    tenant_role: invitation.tenant_role,
  })

  if (insertError) {
    return { error: 'Error al crear tu perfil. Contacta con soporte.' }
  }

  // 5. Marcar invitación como aceptada
  await adminClient
    .from('tenant_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return { success: true, tenant_id: invitation.tenant_id }
}
