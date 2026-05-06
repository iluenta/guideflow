'use client'

import { useState, useTransition } from 'react'
import { UserPlus, MoreVertical, Mail, RefreshCw, Shield, Trash2, AlertCircle } from 'lucide-react'
import { can, type TenantRole } from '@/lib/permissions'
import { getLimit, type PackageLevel } from '@/lib/entitlements'
import { updateMemberRole, removeMember, resendInvitation } from '@/app/actions/team'
import { InviteModal } from './InviteModal'
import type { TeamMember, PendingInvitation } from '@/app/actions/team'

const ROLE_LABELS: Record<string, string> = {
  owner:   'Propietario',
  admin:   'Administrador',
  support: 'Soporte',
  viewer:  'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  owner:   'bg-landing-navy/10 text-landing-navy',
  admin:   'bg-blue-100 text-blue-700',
  support: 'bg-emerald-100 text-emerald-700',
  viewer:  'bg-gray-100 text-gray-600',
}

interface TeamListProps {
  members: TeamMember[]
  invitations: PendingInvitation[]
  currentUserId: string
  currentUserRole: TenantRole
  packageLevel: PackageLevel
}

export function TeamList({
  members,
  invitations,
  currentUserId,
  currentUserRole,
  packageLevel,
}: TeamListProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [localMembers, setLocalMembers] = useState(members)
  const [localInvitations, setLocalInvitations] = useState(invitations)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canInvite = can(currentUserRole, 'members', 'invite')
  const canEdit = can(currentUserRole, 'members', 'edit')
  const canRemove = can(currentUserRole, 'members', 'remove')
  const limit = getLimit(packageLevel, 'max_team_members')
  const atLimit = localMembers.length >= limit

  function handleRemove(memberId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await removeMember(memberId)
      if (result.error) { setActionError(result.error); return }
      setLocalMembers((prev) => prev.filter((m) => m.id !== memberId))
      setOpenMenuId(null)
    })
  }

  function handleRoleChange(memberId: string, newRole: 'admin' | 'support' | 'viewer') {
    setActionError(null)
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole)
      if (result.error) { setActionError(result.error); return }
      setLocalMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, tenant_role: newRole } : m))
      )
      setOpenMenuId(null)
    })
  }

  function handleResend(invitationId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await resendInvitation(invitationId)
      if (result.error) { setActionError(result.error); return }
      setLocalInvitations((prev) =>
        prev.map((i) =>
          i.id === invitationId ? { ...i, email_sent_at: new Date().toISOString() } : i
        )
      )
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-landing-ink">Equipo</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {localMembers.length} de {limit === 999 ? '∞' : limit} miembros
            </p>
          </div>
          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={atLimit}
              title={atLimit ? `Tu plan ${packageLevel} permite hasta ${limit} miembros` : undefined}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-landing-navy text-white text-sm font-bold hover:bg-landing-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invitar miembro
            </button>
          )}
        </div>

        {actionError && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Miembros activos</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {localMembers.map((member) => {
              const isCurrentUser = member.id === currentUserId
              const isOwner = member.tenant_role === 'owner'
              const canActOn = !isOwner && !isCurrentUser

              return (
                <li key={member.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-landing-navy to-landing-mint-deep text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {(member.full_name || member.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-landing-ink truncate">
                      {member.full_name ?? member.email}
                      {isCurrentUser && (
                        <span className="ml-2 text-[10px] text-gray-400 font-normal">(tú)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_COLORS[member.tenant_role]}`}>
                    {ROLE_LABELS[member.tenant_role]}
                  </span>

                  {/* Actions menu */}
                  {(canEdit || canRemove) && canActOn && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === member.id && (
                        <div className="absolute right-0 top-9 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                          {canEdit && (
                            <>
                              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Cambiar rol
                              </p>
                              {(['admin', 'support', 'viewer'] as const).map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(member.id, r)}
                                  disabled={isPending || member.tenant_role === r}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                                  {ROLE_LABELS[r]}
                                  {member.tenant_role === r && (
                                    <span className="ml-auto text-[10px] text-gray-400">actual</span>
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                          {canRemove && (
                            <button
                              onClick={() => handleRemove(member.id)}
                              disabled={isPending}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar miembro
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Pending invitations */}
        {localInvitations.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Invitaciones pendientes
              </p>
            </div>
            <ul className="divide-y divide-gray-50">
              {localInvitations.map((inv) => (
                <li key={inv.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-landing-ink truncate">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      Caduca {new Date(inv.expires_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_COLORS[inv.tenant_role]}`}>
                    {ROLE_LABELS[inv.tenant_role]}
                  </span>
                  {!inv.email_sent_at && canInvite && (
                    <button
                      onClick={() => handleResend(inv.id)}
                      disabled={isPending}
                      title="Email no enviado — reenviar"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reenviar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
          }}
        />
      )}
    </>
  )
}
