'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, X, UserCog, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getProviders, createProvider, updateProvider, toggleProvider } from '@/app/actions/providers'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import { toast } from 'sonner'
import type { Provider, ProviderType } from '@/types/reservations'
import { EXPENSE_CATEGORIES, CATEGORY_LABEL } from '@/lib/constants/categories'

const TYPE_COLORS: Partial<Record<ProviderType, { bg: string; color: string }>> = {
  cleaning:    { bg: '#ecfdf9', color: '#0d9488' },
  laundry:     { bg: '#f3e5f5', color: '#7b1fa2' },
  checkin:     { bg: '#eef2fb', color: '#1e3a8a' },
  maintenance: { bg: '#fef3c7', color: '#b45309' },
  utilities:   { bg: '#e3f2fd', color: '#1565c0' },
  wifi:        { bg: '#f1f8e9', color: '#558b2f' },
  streaming:   { bg: '#fce4ec', color: '#c62828' },
  community:   { bg: '#f9fbe7', color: '#827717' },
  insurance:   { bg: '#e8eaf6', color: '#283593' },
  ibi:         { bg: '#fafafa', color: '#424242' },
  supplies:    { bg: '#fff8e1', color: '#f57f17' },
  marketing:   { bg: '#fbe9e7', color: '#bf360c' },
  management:  { bg: '#ede7f6', color: '#4527a0' },
  other:       { bg: '#f1f4f8', color: '#475569' },
}
const DEFAULT_COLOR = { bg: '#f1f4f8', color: '#475569' }

function ProviderModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: Provider | null
  onClose: () => void
  onSaved: (p: Provider) => void
}) {
  const [name, setName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<ProviderType[]>([])
  const [primaryCategory, setPrimaryCategory] = useState<ProviderType | ''>('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setPhone(editing?.phone ?? '')
      setEmail(editing?.email ?? '')
      setNotes(editing?.notes ?? '')
      const services = editing?.provider_services ?? []
      const cats = services.map(s => s.category)
      setSelectedCategories(cats)
      const primary = services.find(s => s.is_primary)?.category ?? (cats[0] ?? '')
      setPrimaryCategory(primary)
    }
  }, [open, editing])

  function toggleCategory(cat: ProviderType) {
    setSelectedCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
      // Si se elimina el primario, reasignar
      if (!next.includes(primaryCategory as ProviderType)) {
        setPrimaryCategory(next[0] ?? '')
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    const input = {
      name: name.trim(),
      categories: selectedCategories,
      primary_category: (primaryCategory as ProviderType) || null,
      phone: phone || undefined,
      email: email || undefined,
      notes: notes || undefined,
    }
    const result = editing
      ? await updateProvider(editing.id, input)
      : await createProvider(input)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.provider) {
      toast.success(editing ? 'Proveedor actualizado' : 'Proveedor creado')
      onSaved(result.provider)
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px] z-[200]" onClick={onClose} />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.25)] pointer-events-auto max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-[#eef2f7] flex items-start justify-between shrink-0">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-1">Proveedor</p>
              <h2 className="text-[20px] font-bold text-[#1e3a8a] tracking-tight">
                {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#f1f4f8] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label>Nombre <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="Ej: Nicoleta Ionescu"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Servicios — multi-select con checkboxes */}
            <div className="space-y-2">
              <Label>Servicios que ofrece</Label>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {EXPENSE_CATEGORIES.map(c => {
                  const active = selectedCategories.includes(c.value as ProviderType)
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleCategory(c.value as ProviderType)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-left transition-all ${
                        active
                          ? 'bg-landing-navy text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                        active ? 'border-white bg-white' : 'border-slate-300'
                      }`}>
                        {active && <span className="block w-1.5 h-1.5 rounded-[2px] bg-landing-navy" />}
                      </span>
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Servicio principal (solo si hay más de uno) */}
            {selectedCategories.length > 1 && (
              <div className="space-y-1.5">
                <Label>Servicio principal</Label>
                <Select
                  value={primaryCategory}
                  onValueChange={v => setPrimaryCategory(v as ProviderType)}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona el principal..." /></SelectTrigger>
                  <SelectContent>
                    {selectedCategories.map(cat => {
                      const label = EXPENSE_CATEGORIES.find(e => e.value === cat)?.label ?? cat
                      return <SelectItem key={cat} value={cat}>{label}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">
                  Se usa para el badge e icono en el listado de proveedores.
                </p>
              </div>
            )}

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Teléfono <span className="text-slate-400 font-normal">(opcional)</span></Label>
                <Input placeholder="+34 600 000 000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-slate-400 font-normal">(opcional)</span></Label>
                <Input type="email" placeholder="proveedor@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notas <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input placeholder="Información adicional..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex justify-end gap-2.5 shrink-0 border-t border-[#eef2f7] pt-4">
            <Button variant="outline" className="rounded-full" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProvidersPage() {
  const { profile } = useUserProfile()
  const canEdit = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'edit') : false

  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    loadProviders()
  }, [showInactive]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProviders = async () => {
    setLoading(true)
    const { providers: data, error } = await getProviders(showInactive)
    setLoading(false)
    if (error) { toast.error(error); return }
    setProviders(data)
  }

  const handleToggle = async (p: Provider) => {
    setToggling(p.id)
    const result = await toggleProvider(p.id, !p.is_active)
    setToggling(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      setProviders(prev => showInactive
        ? prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x)
        : prev.filter(x => x.id !== p.id)
      )
      toast.success(p.is_active ? 'Proveedor desactivado' : 'Proveedor activado')
    }
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (p: Provider) => { setEditing(p); setModalOpen(true) }

  const handleSaved = (saved: Provider) => {
    setProviders(prev => {
      const exists = prev.find(x => x.id === saved.id)
      return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]
    })
  }

  const visible = providers
    .filter(p => showInactive || p.is_active)
    .filter(p => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.provider_services ?? []).some(s => (CATEGORY_LABEL[s.category as keyof typeof CATEGORY_LABEL] ?? '').toLowerCase().includes(q))
      )
    })

  return (
    <div className="p-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end gap-6 mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Configuración
          </p>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1e293b]">Proveedores</h1>
          <p className="text-slate-500 text-[14px] mt-1">{visible.length} proveedor{visible.length !== 1 ? 'es' : ''} activo{visible.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              className="pl-8 rounded-full bg-[#f1f4f8] border-transparent focus:border-[#3b5bbd] w-52 h-9 text-[13px]"
              placeholder="Buscar proveedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={showInactive ? 'all' : 'active'}
            onValueChange={v => setShowInactive(v === 'all')}
          >
            <SelectTrigger className="h-9 rounded-full bg-[#f1f4f8] border-transparent text-[13px] w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Solo activos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          {canEdit && (
            <Button
              onClick={openCreate}
              className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full h-9 px-4 text-[13px] flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo proveedor
            </Button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-[14px]">Cargando...</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-[#eef2fb] flex items-center justify-center mx-auto mb-4">
            <UserCog className="h-7 w-7 text-[#1e3a8a]" />
          </div>
          <p className="text-[15px] font-semibold text-slate-700 mb-1">Sin proveedores</p>
          <p className="text-[13px] text-slate-400 mb-5">Añade proveedores para asignarlos a los cargos extras de tus reservas</p>
          {canEdit && (
            <Button onClick={openCreate} className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer proveedor
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
          {/* Cabecera tabla */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-[#fafbfc] border-b border-[#eef2f7]">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Nombre</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Tipo</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Teléfono</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Email</span>
            <span />
          </div>

          {visible.map(p => {
            const primaryService = p.provider_services?.find(s => s.is_primary) ?? p.provider_services?.[0]
            const typeStyle = (primaryService ? TYPE_COLORS[primaryService.category] : null) ?? DEFAULT_COLOR
            return (
              <div
                key={p.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 items-center px-5 py-4 border-b border-[#eef2f7] last:border-b-0 transition-colors"
              >
                {/* Nombre + avatar */}
                <div className={`flex items-center gap-3 min-w-0 ${!p.is_active ? 'opacity-40' : ''}`}>
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] font-bold"
                    style={{ background: typeStyle.bg, color: typeStyle.color }}
                  >
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-800 truncate">{p.name}</p>
                    {p.notes && (
                      <p className="text-[11px] text-slate-400 truncate">{p.notes}</p>
                    )}
                  </div>
                </div>

                {/* Tipo — todos los servicios como badges */}
                <div className={!p.is_active ? 'opacity-40' : ''}>
                  {(p.provider_services?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.provider_services!.map(s => {
                        const style = TYPE_COLORS[s.category] ?? DEFAULT_COLOR
                        return (
                          <span
                            key={s.id}
                            className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {CATEGORY_LABEL[s.category as keyof typeof CATEGORY_LABEL] ?? s.category}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-[12px] text-slate-400">—</span>
                  )}
                </div>

                {/* Teléfono */}
                <span className={`text-[13px] text-slate-600 font-mono truncate ${!p.is_active ? 'opacity-40' : ''}`}>
                  {p.phone ?? <span className="text-slate-300">—</span>}
                </span>

                {/* Email */}
                <span className={`text-[13px] text-slate-600 truncate ${!p.is_active ? 'opacity-40' : ''}`}>
                  {p.email ?? <span className="text-slate-300">—</span>}
                </span>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-1.5">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => openEdit(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#eef2fb] hover:text-[#1e3a8a] transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => handleToggle(p)}
                        disabled={toggling === p.id}
                        title={p.is_active ? 'Desactivar' : 'Activar'}
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProviderModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
