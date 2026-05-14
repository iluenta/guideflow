'use client'

import { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getChannels, createChannel, updateChannel, toggleChannel } from '@/app/actions/reservation-settings'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import { toast } from 'sonner'
import type { ChannelSetting, VatTreatment, CollectionParty } from '@/types/reservations'

// ─── Logo colors ──────────────────────────────────────────────────────────────
const LOGO_STYLES: Record<string, { bg: string; color: string; abbr: string }> = {
  airbnb:   { bg: '#ffe5e9', color: '#be185d', abbr: 'AB' },
  booking:  { bg: '#e0edff', color: '#1d4ed8', abbr: 'BK' },
  direct:   { bg: '#ecfdf9', color: '#0d9488', abbr: 'DI' },
  manual:   { bg: '#f1f4f8', color: '#475569', abbr: 'MA' },
  vrbo:     { bg: '#fef3c7', color: '#b45309', abbr: 'VR' },
}

function getLogoStyle(code: string, name: string) {
  return LOGO_STYLES[code] ?? { bg: '#eef2fb', color: '#1e3a8a', abbr: name.substring(0, 2).toUpperCase() }
}

interface ChannelFormData {
  name: string
  code: string
  sale_commission_pct: string
  sale_commission_vat_pct: string
  vat_treatment: VatTreatment
  collection_party: CollectionParty
}

const EMPTY_FORM: ChannelFormData = {
  name: '',
  code: '',
  sale_commission_pct: '0',
  sale_commission_vat_pct: '0',
  vat_treatment: 'none',
  collection_party: 'host',
}

export default function ChannelsPage() {
  const { profile } = useUserProfile()
  const canEdit = profile ? can(profile.tenant_role as TenantRole, 'settings', 'edit') : false

  const [channels, setChannels] = useState<ChannelSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ChannelFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadChannels = async () => {
    setLoading(true)
    const { channels: data } = await getChannels()
    setChannels(data)
    setLoading(false)
  }

  useEffect(() => { loadChannels() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (c: ChannelSetting) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      code: c.code,
      sale_commission_pct: String(c.sale_commission_pct),
      sale_commission_vat_pct: String(c.sale_commission_vat_pct),
      vat_treatment: c.vat_treatment,
      collection_party: c.collection_party,
    })
    setModalOpen(true)
  }

  const handleToggle = async (c: ChannelSetting) => {
    const { error } = await toggleChannel(c.id, !c.is_active)
    if (error) toast.error(error)
    else {
      toast.success(c.is_active ? 'Canal desactivado' : 'Canal activado')
      loadChannels()
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('Nombre y código son obligatorios')
      return
    }

    setSaving(true)
    const input = {
      name: form.name,
      code: form.code,
      sale_commission_pct: parseFloat(form.sale_commission_pct) || 0,
      sale_commission_vat_pct: parseFloat(form.sale_commission_vat_pct) || 0,
      vat_treatment: form.vat_treatment,
      collection_party: form.collection_party,
    }

    if (editingId) {
      const { error } = await updateChannel(editingId, input)
      if (error) { toast.error(error); setSaving(false); return }
      toast.success('Canal actualizado')
    } else {
      const { error } = await createChannel(input)
      if (error) { toast.error(error); setSaving(false); return }
      toast.success('Canal creado')
    }

    setSaving(false)
    setModalOpen(false)
    loadChannels()
  }

  return (
    <div className="px-4 py-8 sm:p-8 max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end gap-6 mb-8 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Ajustes
          </p>
          <h1 className="text-3xl sm:text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
            Canales de venta
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">
            Configura las comisiones por canal
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={openCreate}
            className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full gap-2 shadow-[0_4px_12px_-4px_rgba(30,58,138,0.4)] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo canal
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">Cargando canales...</div>
      ) : (
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
          {channels.map(c => {
            const logo = getLogoStyle(c.code, c.name)
            return (
              <div
                key={c.id}
                className={`bg-white border border-[#eef2f7] rounded-[18px] p-4 sm:p-6 shadow-sm transition-all ${c.is_active ? 'hover:border-[#3b5bbd] hover:shadow-[0_12px_28px_-14px_rgba(30,58,138,0.18)]' : 'opacity-60 bg-[#f1f4f8]'}`}
              >
                <div className="flex justify-between items-start mb-5 gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-[17px] shrink-0"
                      style={{ background: logo.bg, color: logo.color }}
                    >
                      {logo.abbr}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] sm:text-[16px] font-semibold text-slate-800 tracking-[-0.01em] truncate">{c.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{c.code}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={c.is_active}
                        onCheckedChange={() => handleToggle(c)}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#f1f4f8] hover:text-slate-700 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 bg-[#fafbfc] border border-[#eef2f7] rounded-[12px] overflow-hidden mb-4">
                  <div className="p-3 border-r border-[#eef2f7]">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400 mb-1">Com. venta</p>
                    <p className="text-[18px] font-bold text-slate-800 tracking-[-0.02em] leading-none">
                      {c.sale_commission_pct}<span className="text-[13px] text-slate-400 font-medium">%</span>
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 mt-1">IVA {c.sale_commission_vat_pct}%</p>
                  </div>
                  <div className="p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400 mb-1">Quién cobra</p>
                    <p className="text-[14px] font-semibold text-slate-700">
                      {c.collection_party === 'platform' ? 'Plataforma' : 'Host'}
                    </p>
                  </div>
                </div>

                {/* Rows */}
                <div>
                  <div className="flex justify-between items-center py-2.5 border-t border-dashed border-[#eef2f7] text-[13px]">
                    <span className="text-slate-500">Tratamiento IVA</span>
                    <span className="font-medium text-slate-700 capitalize">
                      {c.vat_treatment === 'none' ? 'Sin IVA' : c.vat_treatment === 'standard' ? 'Estándar' : 'Inversión sujeto pasivo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-t border-dashed border-[#eef2f7] text-[13px]">
                    <span className="text-slate-500">Estado</span>
                    <span className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full font-medium ${c.is_active ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#f1f4f8] text-slate-400'}`}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add card */}
          {canEdit && (
            <button
              onClick={openCreate}
              className="border-2 border-dashed border-[#e2e8f0] rounded-[18px] min-h-[280px] flex flex-col items-center justify-center gap-3.5 p-8 transition-all hover:border-[#1e3a8a] hover:bg-[#eef2fb] cursor-pointer text-center"
            >
              <div className="w-11 h-11 rounded-full bg-[#f1f4f8] text-slate-400 flex items-center justify-center transition-all group-hover:bg-[#1e3a8a] group-hover:text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-slate-700">Nuevo canal</h4>
                <p className="text-[12px] text-slate-400 mt-1">Airbnb, Booking, directo, etc.</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Channel Modal */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-1">
              {editingId ? 'Editar' : 'Nuevo'} canal
            </p>
            <DialogTitle className="text-[22px] font-bold text-[#1e3a8a] tracking-tight">
              {editingId ? 'Editar canal' : 'Crear canal'}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre <span className="text-rose-500">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Airbnb" />
              </div>
              <div className="space-y-1.5">
                <Label>Código <span className="text-rose-500">*</span></Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="airbnb" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Comisión venta (%)</Label>
                <Input type="number" min="0" step="0.01" value={form.sale_commission_pct} onChange={e => setForm(f => ({ ...f, sale_commission_pct: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>IVA sobre comisión (%)</Label>
                <Input type="number" min="0" step="0.01" value={form.sale_commission_vat_pct} onChange={e => setForm(f => ({ ...f, sale_commission_vat_pct: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tratamiento IVA</Label>
              <Select value={form.vat_treatment} onValueChange={v => setForm(f => ({ ...f, vat_treatment: v as VatTreatment }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin IVA</SelectItem>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="reverse_charge">Inversión sujeto pasivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>¿Quién cobra al huésped?</Label>
              <Select value={form.collection_party} onValueChange={v => setForm(f => ({ ...f, collection_party: v as CollectionParty }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Plataforma (Airbnb, Booking...)</SelectItem>
                  <SelectItem value="host">Host (tú)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear canal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
