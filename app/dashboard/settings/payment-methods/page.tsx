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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, togglePaymentMethod } from '@/app/actions/reservation-settings'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import { toast } from 'sonner'
import type { PaymentMethodSetting } from '@/types/reservations'

// ─── Logo styles ──────────────────────────────────────────────────────────────
const LOGO_STYLES: Record<string, { bg: string; color: string; abbr: string }> = {
  transfer:        { bg: '#eef2fb', color: '#1e3a8a', abbr: 'TR' },
  cash:            { bg: '#ecfdf5', color: '#047857', abbr: 'EF' },
  airbnb_collect:  { bg: '#ffe5e9', color: '#be185d', abbr: 'AB' },
  booking_collect: { bg: '#e0edff', color: '#1d4ed8', abbr: 'BK' },
  stripe:          { bg: '#efe7ff', color: '#6d28d9', abbr: 'ST' },
}

function getLogoStyle(code: string, name: string) {
  return LOGO_STYLES[code] ?? { bg: '#eef2fb', color: '#1e3a8a', abbr: name.substring(0, 2).toUpperCase() }
}

interface PaymentMethodFormData {
  name: string
  code: string
  payment_commission_pct: string
  payment_commission_vat_pct: string
}

const EMPTY_FORM: PaymentMethodFormData = {
  name: '',
  code: '',
  payment_commission_pct: '0',
  payment_commission_vat_pct: '0',
}

export default function PaymentMethodsPage() {
  const { profile } = useUserProfile()
  const canEdit = profile ? can(profile.tenant_role as TenantRole, 'settings', 'edit') : false

  const [methods, setMethods] = useState<PaymentMethodSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PaymentMethodFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadMethods = async () => {
    setLoading(true)
    const { methods: data } = await getPaymentMethods()
    setMethods(data)
    setLoading(false)
  }

  useEffect(() => { loadMethods() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (m: PaymentMethodSetting) => {
    setEditingId(m.id)
    setForm({
      name: m.name,
      code: m.code,
      payment_commission_pct: String(m.payment_commission_pct),
      payment_commission_vat_pct: String(m.payment_commission_vat_pct),
    })
    setModalOpen(true)
  }

  const handleToggle = async (m: PaymentMethodSetting) => {
    const { error } = await togglePaymentMethod(m.id, !m.is_active)
    if (error) toast.error(error)
    else {
      toast.success(m.is_active ? 'Método desactivado' : 'Método activado')
      loadMethods()
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
      payment_commission_pct: parseFloat(form.payment_commission_pct) || 0,
      payment_commission_vat_pct: parseFloat(form.payment_commission_vat_pct) || 0,
    }

    if (editingId) {
      const { error } = await updatePaymentMethod(editingId, input)
      if (error) { toast.error(error); setSaving(false); return }
      toast.success('Método actualizado')
    } else {
      const { error } = await createPaymentMethod(input)
      if (error) { toast.error(error); setSaving(false); return }
      toast.success('Método creado')
    }

    setSaving(false)
    setModalOpen(false)
    loadMethods()
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end gap-8 mb-8 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Ajustes
          </p>
          <h1 className="text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
            Métodos de pago
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">
            Configura los métodos con los que cobras a tus huéspedes
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={openCreate}
            className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full gap-2 shadow-[0_4px_12px_-4px_rgba(30,58,138,0.4)]"
          >
            <Plus className="h-4 w-4" />
            Nuevo método
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">Cargando métodos...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {methods.map(m => {
            const logo = getLogoStyle(m.code, m.name)
            return (
              <div
                key={m.id}
                className={`bg-white border border-[#eef2f7] rounded-[18px] p-6 shadow-sm transition-all ${m.is_active ? 'hover:border-[#3b5bbd] hover:shadow-[0_12px_28px_-14px_rgba(30,58,138,0.18)]' : 'opacity-60 bg-[#f1f4f8]'}`}
              >
                <div className="flex justify-between items-start mb-5 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-[17px] shrink-0"
                      style={{ background: logo.bg, color: logo.color }}
                    >
                      {logo.abbr}
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold text-slate-800 tracking-[-0.01em]">{m.name}</h3>
                      <p className="text-[12px] text-slate-400 font-mono">{m.code}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={() => handleToggle(m)}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#f1f4f8] hover:text-slate-700 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(m)}>
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
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400 mb-1">Com. cobro</p>
                    <p className="text-[18px] font-bold text-slate-800 tracking-[-0.02em] leading-none">
                      {m.payment_commission_pct}<span className="text-[13px] text-slate-400 font-medium">%</span>
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 mt-1">IVA {m.payment_commission_vat_pct}%</p>
                  </div>
                  <div className="p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400 mb-1">Estado</p>
                    <span className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full font-medium ${m.is_active ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#f1f4f8] text-slate-400'}`}>
                      {m.is_active ? 'Activo' : 'Inactivo'}
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
              className="border-2 border-dashed border-[#e2e8f0] rounded-[18px] min-h-[200px] flex flex-col items-center justify-center gap-3.5 p-8 transition-all hover:border-[#1e3a8a] hover:bg-[#eef2fb] cursor-pointer text-center"
            >
              <div className="w-11 h-11 rounded-full bg-[#f1f4f8] text-slate-400 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-slate-700">Nuevo método</h4>
                <p className="text-[12px] text-slate-400 mt-1">Transferencia, Stripe, etc.</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-1">
              {editingId ? 'Editar' : 'Nuevo'} método
            </p>
            <DialogTitle className="text-[22px] font-bold text-[#1e3a8a] tracking-tight">
              {editingId ? 'Editar método de pago' : 'Crear método de pago'}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre <span className="text-rose-500">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Transferencia" />
              </div>
              <div className="space-y-1.5">
                <Label>Código <span className="text-rose-500">*</span></Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="transfer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Comisión cobro (%)</Label>
                <Input type="number" min="0" step="0.01" value={form.payment_commission_pct} onChange={e => setForm(f => ({ ...f, payment_commission_pct: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>IVA sobre comisión (%)</Label>
                <Input type="number" min="0" step="0.01" value={form.payment_commission_vat_pct} onChange={e => setForm(f => ({ ...f, payment_commission_vat_pct: e.target.value }))} />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear método'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
