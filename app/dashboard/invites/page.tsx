'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Plus, Loader2, Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Invitation {
  id: string
  code: string
  created_at: string
  used_at: string | null
  used_by_ip: string | null
}

export default function InvitesPage() {
  const supabase = createClient()
  const [invites, setInvites] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function load() {
    const { data } = await supabase
      .from('invitations')
      .select('id, code, created_at, used_at, used_by_ip')
      .order('created_at', { ascending: false })
    setInvites(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    setCreating(true)
    const code = Math.random().toString(36).slice(2, 10).toUpperCase()
    const { error } = await supabase.from('invitations').insert({ code })
    if (!error) await load()
    setCreating(false)
  }

  async function remove(id: string) {
    await supabase.from('invitations').delete().eq('id', id)
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  function copy(invite: Invitation) {
    navigator.clipboard.writeText(`${baseUrl}/i/${invite.code}`)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-landing-ink tracking-tight">Invitaciones</h1>
          <p className="text-sm text-landing-ink-mute mt-1">
            Genera enlaces de descarga de un solo uso para Recetario AI
          </p>
        </div>
        <Button onClick={create} disabled={creating} className="gap-2">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Nueva invitación
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-landing-ink-mute" />
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-landing-rule text-landing-ink-mute">
          <Link2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay invitaciones todavía. Crea la primera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map(invite => {
            const url = `${baseUrl}/i/${invite.code}`
            const used = !!invite.used_at
            return (
              <div
                key={invite.id}
                className={`flex items-center gap-4 p-4 rounded-xl border bg-white ${used ? 'opacity-50' : 'border-landing-rule'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-landing-ink truncate">{invite.code}</p>
                  <p className="text-xs text-landing-ink-mute truncate mt-0.5">{url}</p>
                  {used && (
                    <p className="text-xs text-landing-rose mt-1">
                      Usado · {invite.used_by_ip} · {new Date(invite.used_at!).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!used && (
                    <button
                      onClick={() => copy(invite)}
                      title="Copiar enlace"
                      className="p-2 rounded-lg hover:bg-landing-bg-deep text-landing-ink-mute hover:text-landing-ink transition-colors"
                    >
                      {copiedId === invite.id
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => remove(invite.id)}
                    title="Eliminar"
                    className="p-2 rounded-lg hover:bg-landing-rose-tint/50 text-landing-ink-mute hover:text-landing-rose transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
