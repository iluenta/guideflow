'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Copy, Check, Plus, Loader2, Link2, Trash2,
  Send, Clock, CheckCircle2, XCircle, RefreshCw,
  Mail, User, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { sendInviteEmailAction } from '@/app/actions/invites'

interface Invitation {
  id: string
  code: string
  notes: string | null
  created_at: string
  used_at: string | null
  used_by_ip: string | null
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode() {
  return Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

export default function InvitesPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [invites, setInvites]     = useState<Invitation[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'all' | 'pending' | 'used'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedId, setCopiedId]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  // Dialog form state
  const [recipient, setRecipient] = useState('')
  const [email, setEmail]         = useState('')
  const [creating, setCreating]   = useState(false)
  const [createdInvite, setCreatedInvite] = useState<Invitation | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hospyia.com'

  async function load() {
    const { data } = await supabase
      .from('invitations')
      .select('id, code, notes, created_at, used_at, used_by_ip')
      .order('created_at', { ascending: false })
    setInvites(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => ({
    total:   invites.length,
    pending: invites.filter(i => !i.used_at).length,
    used:    invites.filter(i => !!i.used_at).length,
  }), [invites])

  const filtered = useMemo(() => {
    if (tab === 'pending') return invites.filter(i => !i.used_at)
    if (tab === 'used')    return invites.filter(i => !!i.used_at)
    return invites
  }, [invites, tab])

  function openCreate() {
    setRecipient('')
    setEmail('')
    setCreatedInvite(null)
    setDialogOpen(true)
  }

  async function create() {
    setCreating(true)
    const code  = genCode()
    const notes = [recipient, email].filter(Boolean).join(' · ') || null
    const { data, error } = await supabase
      .from('invitations')
      .insert({ code, notes })
      .select()
      .single()

    if (error || !data) {
      toast({ title: 'Error', description: 'No se pudo crear la invitación.', variant: 'destructive' })
      setCreating(false)
      return
    }

    setCreatedInvite(data)
    setInvites(prev => [data, ...prev])
    setCreating(false)
  }

  function inviteUrl(code: string) {
    return `${baseUrl}/i/${code}`
  }

  async function copy(invite: Invitation) {
    await navigator.clipboard.writeText(inviteUrl(invite.code))
    setCopiedId(invite.id)
    toast({ title: 'Enlace copiado', description: invite.code })
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function sendByEmail(invite: Invitation) {
    if (!email.trim()) {
      toast({ title: 'Falta el email', description: 'Indica un email de destinatario para poder enviarlo.', variant: 'destructive' })
      return
    }
    setSendingEmail(true)
    const result = await sendInviteEmailAction({
      to: email,
      recipientName: recipient,
      code: invite.code,
      url: inviteUrl(invite.code),
    })
    setSendingEmail(false)

    if ('error' in result) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Email enviado', description: `Invitación enviada a ${email}` })
  }

  async function remove(id: string) {
    setDeleting(id)
    await supabase.from('invitations').delete().eq('id', id)
    setInvites(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  function closeDialog() {
    setDialogOpen(false)
    setCreatedInvite(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 pb-24 lg:pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-landing-navy" />
            <h1 className="text-xl sm:text-2xl font-bold text-landing-ink tracking-tight">Invitaciones</h1>
          </div>
          <p className="text-sm text-landing-ink-mute">
            Genera y gestiona enlaces de descarga únicos para Recetario AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg text-landing-ink-mute hover:bg-landing-bg-deep transition-colors shrink-0"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={openCreate} className="gap-2 flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" />
            Nueva invitación
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total',     value: stats.total,   icon: Link2,        color: 'text-landing-navy',  bg: 'bg-landing-navy-tint' },
          { label: 'Pendientes',value: stats.pending, icon: Clock,        color: 'text-amber-600',     bg: 'bg-amber-50' },
          { label: 'Usadas',    value: stats.used,    icon: CheckCircle2, color: 'text-emerald-600',   bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-landing-rule p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-landing-ink leading-none">{value}</p>
              <p className="text-[11px] sm:text-xs text-landing-ink-mute mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + List */}
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
            <TabsTrigger value="used">Usadas ({stats.used})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-landing-ink-mute" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-landing-rule">
            <Link2 className="w-8 h-8 mx-auto mb-3 text-landing-ink-mute opacity-30" />
            <p className="text-sm text-landing-ink-mute">
              {tab === 'all' ? 'No hay invitaciones todavía.' : `No hay invitaciones ${tab === 'pending' ? 'pendientes' : 'usadas'}.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-landing-rule overflow-hidden">
            {filtered.map((invite, idx) => {
              const used = !!invite.used_at
              const url  = inviteUrl(invite.code)
              return (
                <div
                  key={invite.id}
                  className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 ${idx !== 0 ? 'border-t border-landing-rule' : ''} ${used ? 'bg-landing-bg/40' : ''}`}
                >
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${used ? 'bg-landing-ink-mute/30' : 'bg-emerald-400'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-mono text-sm font-bold text-landing-ink">{invite.code}</span>
                      <Badge variant={used ? 'secondary' : 'default'} className="text-[10px] px-2 py-0">
                        {used ? 'Usada' : 'Pendiente'}
                      </Badge>
                      {invite.notes && (
                        <span className="text-xs text-landing-ink-mute truncate max-w-[120px] sm:max-w-[200px]">{invite.notes}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-landing-ink-mute">
                      <span className="shrink-0">{timeAgo(invite.created_at)}</span>
                      {used && invite.used_at && (
                        <>
                          <span className="shrink-0">·</span>
                          <span className="text-emerald-600 truncate">Descargada {timeAgo(invite.used_at)}</span>
                          {invite.used_by_ip && <><span className="shrink-0 hidden sm:inline">·</span><span className="hidden sm:inline">{invite.used_by_ip}</span></>}
                        </>
                      )}
                      {!used && (
                        <><span className="shrink-0 hidden sm:inline">·</span><span className="hidden sm:inline truncate max-w-[200px] sm:max-w-[280px] text-landing-ink-mute/60">{url}</span></>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!used && (
                      <button
                        onClick={() => copy(invite)}
                        title="Copiar enlace"
                        className="p-2 rounded-lg hover:bg-landing-bg-deep text-landing-ink-mute hover:text-landing-ink transition-colors"
                      >
                        {copiedId === invite.id
                          ? <Check className="w-4 h-4 text-emerald-500" />
                          : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => remove(invite.id)}
                      disabled={deleting === invite.id}
                      title="Eliminar"
                      className="p-2 rounded-lg hover:bg-landing-rose-tint/50 text-landing-ink-mute hover:text-landing-rose transition-colors disabled:opacity-40"
                    >
                      {deleting === invite.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog: crear invitación */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <VisuallyHidden.Root>
            <DialogTitle>{createdInvite ? 'Invitación generada' : 'Nueva invitación'}</DialogTitle>
          </VisuallyHidden.Root>

          {!createdInvite ? (
            <>
              {/* Header con gradiente */}
              <div className="bg-gradient-to-br from-landing-navy to-[#15296b] px-6 pt-7 pb-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-landing-mint/20 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full blur-xl" />
                <div className="relative">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
                    <Link2 className="w-5 h-5 text-landing-mint" />
                  </div>
                  <h2 className="text-white font-bold text-lg leading-tight">Nueva invitación</h2>
                  <p className="text-white/50 text-xs mt-1">Enlace de descarga único para Recetario AI</p>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recipient" className="text-xs font-semibold text-landing-ink-mute uppercase tracking-wide">
                    Destinatario <span className="normal-case font-normal">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-landing-ink-mute/50" />
                    <Input
                      id="recipient"
                      placeholder="Nombre o alias"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      className="pl-9 h-11"
                      onKeyDown={e => e.key === 'Enter' && create()}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-landing-ink-mute uppercase tracking-wide">
                    Email <span className="normal-case font-normal">(opcional — para enviar)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-landing-ink-mute/50" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="destinatario@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      onKeyDown={e => e.key === 'Enter' && create()}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-landing-bg-deep rounded-xl px-3.5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-landing-navy mt-1.5 shrink-0" />
                  <p className="text-xs text-landing-ink-mute leading-relaxed">
                    Se genera un código de un solo uso. El APK se descarga automáticamente al abrir el enlace.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 pb-6">
                <Button variant="outline" onClick={closeDialog} className="h-10">Cancelar</Button>
                <Button onClick={create} disabled={creating} className="gap-2 h-10 px-5">
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                    : <><Plus className="w-4 h-4" /> Generar enlace</>}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Header success */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-7 pb-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
                <div className="relative text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-white font-bold text-lg">¡Invitación lista!</h2>
                  {createdInvite.notes && (
                    <p className="text-white/60 text-xs mt-1">Para: {createdInvite.notes}</p>
                  )}
                </div>
              </div>

              {/* Code + URL */}
              <div className="px-6 py-5 space-y-3">
                {/* Code pill */}
                <div className="flex items-center justify-between bg-landing-bg-deep rounded-xl px-5 py-4">
                  <div>
                    <p className="text-[10px] font-semibold text-landing-ink-mute uppercase tracking-widest mb-0.5">Código</p>
                    <p className="font-mono text-xl font-bold text-landing-ink tracking-[0.15em]">{createdInvite.code}</p>
                  </div>
                  <div className="w-px h-8 bg-landing-rule mx-2" />
                  <button
                    onClick={() => copy(createdInvite)}
                    className="flex flex-col items-center gap-1 text-landing-ink-mute hover:text-landing-navy transition-colors"
                  >
                    {copiedId === createdInvite.id
                      ? <Check className="w-5 h-5 text-emerald-500" />
                      : <Copy className="w-5 h-5" />}
                    <span className="text-[10px]">{copiedId === createdInvite.id ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {/* URL row */}
                <div className="flex items-center gap-2 bg-landing-bg-deep/60 border border-landing-rule rounded-xl px-4 py-2.5">
                  <p className="flex-1 font-mono text-[11px] text-landing-ink-mute truncate">{inviteUrl(createdInvite.code)}</p>
                </div>

                {/* Warning */}
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                  <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">Este enlace es de un solo uso. Guárdalo antes de cerrar.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row gap-2 px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() => sendByEmail(createdInvite)}
                  disabled={sendingEmail || !email.trim()}
                  title={!email.trim() ? 'Indica un email en el paso anterior para poder enviarlo' : undefined}
                  className="gap-2 flex-1 h-10"
                >
                  {sendingEmail
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : <><Send className="w-4 h-4" /> Enviar por email</>}
                </Button>
                <Button onClick={() => { copy(createdInvite); closeDialog() }} className="gap-2 flex-1 h-10">
                  <Copy className="w-4 h-4" />
                  Copiar y cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
