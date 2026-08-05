'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import {
  getCheckinSettings,
  updatePropertySesSettings,
  getSesCommunicationsLog,
  markCommunicationUploaded,
  type CheckinPropertySettings,
  type SesCommunicationLogEntry,
} from '@/app/actions/checkin-settings'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:            { label: 'Pendiente', className: 'bg-slate-100 text-slate-500' },
  generated:          { label: 'Por subir a SES', className: 'bg-amber-50 text-amber-700' },
  uploaded_manually:  { label: 'Subida', className: 'bg-emerald-50 text-emerald-700' },
  failed:             { label: 'Error', className: 'bg-rose-50 text-rose-700' },
}

function PropertyCard({ property, canEdit, onSaved }: { property: CheckinPropertySettings; canEdit: boolean; onSaved: () => void }) {
  const [code, setCode] = useState(property.ses_establishment_code ?? '')
  const [enabled, setEnabled] = useState(property.ses_communication_enabled)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await updatePropertySesSettings(property.id, {
      ses_establishment_code: code.trim(),
      ses_communication_enabled: enabled,
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('Configuración guardada')
    onSaved()
  }

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-6 space-y-4">
      <h3 className="text-[15px] font-semibold text-slate-800">{property.name}</h3>

      <div className="space-y-1.5">
        <Label>Código de establecimiento SES</Label>
        <Input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="0000127783"
          disabled={!canEdit}
          className="font-mono"
        />
        <p className="text-[11px] text-slate-400">
          Lo encuentras en{' '}
          <a href="https://sede.interior.gob.es/portal/sede" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">
            sede.interior.gob.es <ExternalLink className="h-2.5 w-2.5" />
          </a>{' '}
          → Mis datos registrados.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Generar y enviar comunicación SES</Label>
          <p className="text-[11px] text-slate-400">Si está desactivado, el check-in se completa pero no se genera el XML.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!canEdit} />
      </div>

      {canEdit && (
        <Button size="sm" className="rounded-full" disabled={saving} onClick={handleSave}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      )}
    </div>
  )
}

export default function CheckinSettingsPage() {
  const { profile } = useUserProfile()
  const canEdit = profile ? can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings') : false

  const [properties, setProperties] = useState<CheckinPropertySettings[]>([])
  const [log, setLog] = useState<SesCommunicationLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [{ data: props }, { data: logData }] = await Promise.all([
      getCheckinSettings(),
      getSesCommunicationsLog(),
    ])
    setProperties(props ?? [])
    setLog(logData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleMarkUploaded(id: string) {
    const { error } = await markCommunicationUploaded(id)
    if (error) { toast.error(error); return }
    toast.success('Marcada como subida')
    load()
  }

  return (
    <div className="px-4 py-8 sm:p-8 max-w-[1440px] mx-auto space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
          <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
          Ajustes
        </p>
        <h1 className="text-3xl sm:text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
          Check-in y SES Hospedajes
        </h1>
        <p className="text-[15px] text-slate-500 mt-2">
          Código de establecimiento y estado de las comunicaciones a SES Hospedajes.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">Cargando…</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} canEdit={canEdit} onSaved={load} />
            ))}
            {properties.length === 0 && (
              <p className="text-[13px] text-slate-400">No hay propiedades configuradas.</p>
            )}
          </div>

          <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eef2f7]">
              <h3 className="text-[14px] font-semibold text-slate-800">Comunicaciones generadas</h3>
            </div>
            {log.length === 0 ? (
              <p className="text-[13px] text-slate-400 px-6 py-8 text-center">Todavía no se ha generado ninguna comunicación.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-[#eef2f7]">
                    <th className="px-6 py-3 font-medium">Entrada</th>
                    <th className="px-6 py-3 font-medium">Propiedad</th>
                    <th className="px-6 py-3 font-medium">Huéspedes</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {log.map(entry => {
                    const status = STATUS_LABELS[entry.status] ?? STATUS_LABELS.pending
                    return (
                      <tr key={entry.id} className="border-b border-[#f6f8fb] last:border-0">
                        <td className="px-6 py-3">{entry.checkin_date}</td>
                        <td className="px-6 py-3">{entry.property?.name ?? '—'}</td>
                        <td className="px-6 py-3">{entry.guests_count}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {entry.status === 'generated' && canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full h-7 text-[11px] gap-1"
                              onClick={() => handleMarkUploaded(entry.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Marcar como subida
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
