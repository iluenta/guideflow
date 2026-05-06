'use client'

import { useEffect, useState } from 'react'
import { useUserProfile } from '@/hooks/use-user-profile'
import { getTeamMembers, type TeamMember, type PendingInvitation } from '@/app/actions/team'
import { TeamList } from '@/components/dashboard/team/TeamList'
import { type TenantRole } from '@/lib/permissions'
import { type PackageLevel } from '@/lib/entitlements'
import { Loader2 } from 'lucide-react'

export default function TeamPage() {
  const { profile, loading: profileLoading } = useUserProfile()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [packageLevel, setPackageLevel] = useState<PackageLevel>('basic')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profileLoading || !profile) return

    async function load() {
      try {
        setLoading(true)

        // Cargar miembros e invitaciones
        const teamResult = await getTeamMembers()
        if (teamResult.error) { setError(teamResult.error); return }
        setMembers(teamResult.members)
        setInvitations(teamResult.invitations)

        // Cargar package_level del tenant
        const tenantRes = await fetch('/api/tenant/package-level', { credentials: 'include' })
        if (tenantRes.ok) {
          const { packageLevel: level } = await tenantRes.json()
          setPackageLevel(level ?? 'basic')
        }
      } catch {
        setError('Error al cargar el equipo')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [profile, profileLoading])

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <TeamList
        members={members}
        invitations={invitations}
        currentUserId={profile.id}
        currentUserRole={(profile.tenant_role as TenantRole) ?? 'owner'}
        packageLevel={packageLevel}
      />
    </div>
  )
}
