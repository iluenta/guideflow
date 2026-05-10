'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Calendar, Lock, Eye, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReservationDrawer } from '@/components/dashboard/reservations/ReservationDrawer'
import { toast } from 'sonner'
import { getReservations, getReservation, deleteReservation } from '@/app/actions/reservations'
import { round2 } from '@/lib/reservations/commission-utils'
import { getChannels, getPaymentMethods } from '@/app/actions/reservation-settings'
import { getProperties } from '@/app/actions/properties'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import type {
  ReservationListItem,
  ReservationWithDetails,
  ReservationFilters,
  ReservationStatus,
  ChannelSetting,
  PaymentMethodSetting,
} from '@/types/reservations'

// ─── Channel styles ───────────────────────────────────────────────────────────
const CHANNEL_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  airbnb:   { bg: '#ffe5e9', color: '#be185d', dot: '#e11d48' },
  booking:  { bg: '#e0edff', color: '#1d4ed8', dot: '#1d4ed8' },
  direct:   { bg: '#ecfdf9', color: '#0d9488', dot: '#0d9488' },
  manual:   { bg: '#f1f4f8', color: '#475569', dot: '#94a3b8' },
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  checked_in:  'En curso',
  checked_out: 'Finalizada',
  cancelled:   'Cancelada',
  no_show:     'No show',
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  pending:     { bg: '#fef3c7', color: '#d97706', dot: '#d97706' },
  confirmed:   { bg: '#ecfdf5', color: '#047857', dot: '#10b981' },
  checked_in:  { bg: '#eef2fb', color: '#1e3a8a', dot: '#1e3a8a' },
  checked_out: { bg: '#f1f4f8', color: '#475569', dot: '#94a3b8' },
  cancelled:   { bg: '#ffe4e6', color: '#e11d48', dot: '#e11d48' },
  no_show:     { bg: '#fef3c7', color: '#d97706', dot: '#d97706' },
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'checked_in', label: 'En curso' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'cancelled', label: 'Canceladas' },
]

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function yearToDateRange(y: string): { date_from?: string; date_to?: string } {
  if (y === 'all') return {}
  const year = parseInt(y, 10)
  if (isNaN(year)) return {}
  return { date_from: `${year}-01-01`, date_to: `${year}-12-31` }
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { profile } = useUserProfile()
  const canCreate = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'create') : false
  const canEdit   = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'edit') : false
  const canCancel = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'cancel') : false
  const canDelete = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'delete') : false

  const [reservations, setReservations] = useState<ReservationListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState<ChannelSetting[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([])

  // Filters
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterProperty, setFilterProperty] = useState('')
  const [filterPending, setFilterPending] = useState(false)
  const [page, setPage] = useState(1)

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ReservationListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Query param ?view=ID para abrir el drawer tras editar
  const searchParams = useSearchParams()
  const viewId = searchParams.get('view')
  const yearParam = searchParams.get('year') ?? String(new Date().getFullYear())

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { date_from, date_to } = yearToDateRange(yearParam)
    const filters: ReservationFilters = {
      page,
      per_page: 20,
      has_pending: filterPending || undefined,
      ...(date_from ? { date_from, date_to } : {}),
    }
    if (statusTab !== 'all') filters.status = [statusTab as ReservationStatus]
    if (search) filters.search = search
    if (filterChannel) filters.channel_id = filterChannel
    if (filterProperty) filters.property_id = filterProperty

    const { reservations: rows, total: t } = await getReservations(filters)
    setReservations(rows)
    setTotal(t)
    setLoading(false)
  }, [page, statusTab, search, filterChannel, filterProperty, filterPending, yearParam])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    Promise.all([
      getChannels(),
      getPaymentMethods(),
      getProperties(),
    ]).then(([{ channels: chs }, { methods }, props]) => {
      setChannels(chs)
      setPaymentMethods(methods)
      setProperties((props as unknown as { id: string; name: string }[]) ?? [])
    })
  }, [])

  const openDrawer = async (id: string) => {
    // Optimistic: abre el drawer inmediatamente con los datos de lista
    // mientras carga el detalle completo
    const quick = reservations.find(r => r.id === id)
    if (quick) {
      setSelectedReservation(quick as unknown as ReservationWithDetails)
      setDrawerOpen(true)
    }
    const { reservation, error } = await getReservation(id)
    if (error) {
      toast.error(`Error al cargar la reserva: ${error}`)
      return
    }
    if (reservation) {
      setSelectedReservation(reservation)
    }
  }

  const handleReservationUpdated = (updated: ReservationWithDetails) => {
    setSelectedReservation(updated)
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteReservation(deleteTarget.id)
    setDeleting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDeleteTarget(null)
    if (drawerOpen && selectedReservation?.id === deleteTarget.id) {
      setDrawerOpen(false)
      setSelectedReservation(null)
    }
    let msg = 'Reserva eliminada'
    if (result.had_payments) msg += ' · Los cobros asociados también fueron eliminados'
    toast.success(msg)
    fetchData()
  }

  // Abrir drawer cuando viene ?view=ID y los datos ya cargaron
  useEffect(() => {
    if (!viewId || loading) return
    openDrawer(viewId)
  }, [viewId, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // KPI totals from current list
  const grossTotal = reservations.reduce((s, r) => s + r.gross_amount, 0)
  const netTotal = reservations.reduce((s, r) => s + r.net_amount, 0)
  const pendingTotal = reservations.reduce((s, r) => s + Math.max(0, round2(r.net_amount - r.total_received)), 0)

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      {/* Page header */}
      <div className="flex justify-between items-end gap-8 mb-8 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Dashboard
          </p>
          <h1 className="text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
            Reservas
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">
            {total} reserva{total !== 1 ? 's' : ''} · {yearParam === 'all' ? 'Histórico completo' : yearParam}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/calendar">
            <Button variant="outline" className="rounded-full gap-2">
              <Calendar className="h-4 w-4" />
              Calendario
            </Button>
          </Link>
          {canCreate && (
            <Link href="/dashboard/bookings/new">
              <Button className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full gap-2 shadow-[0_4px_12px_-4px_rgba(30,58,138,0.4)]">
                <Plus className="h-4 w-4" />
                Nueva reserva
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 bg-white border border-[#eef2f7] rounded-[18px] mb-6 overflow-hidden shadow-sm">
        <KPI label="Reservas" value={String(total)} sub="en el filtro actual" />
        <KPI label="Ingresos brutos" value={`€${fmt(grossTotal)}`} sub="total bruto" />
        <KPI label="Neto estimado" value={`€${fmt(netTotal)}`} sub="después de comisiones" />
        <KPI label="Pendiente cobro" value={`€${fmt(pendingTotal)}`} sub="sin cobrar" valueClass="pending" />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#eef2f7] rounded-[18px] p-2.5 flex items-center justify-between gap-4 mb-6 flex-wrap shadow-sm">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setStatusTab(t.value); setPage(1) }}
              className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition-all ${
                statusTab === t.value
                  ? 'bg-[#1e3a8a] text-white shadow-[0_4px_10px_-2px_rgba(30,58,138,0.35)]'
                  : 'text-slate-500 hover:bg-[#f1f4f8] hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              className="pl-8 rounded-full bg-[#f1f4f8] border-transparent focus:border-[#3b5bbd] w-52 h-9 text-[13px]"
              placeholder="Buscar huésped..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Channel filter */}
          {channels.length > 0 && (
            <Select value={filterChannel || '_all'} onValueChange={v => { setFilterChannel(v === '_all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-9 rounded-full bg-[#f1f4f8] border-transparent text-[13px] w-36">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos los canales</SelectItem>
                {channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Property filter */}
          {properties.length > 1 && (
            <Select value={filterProperty || '_all'} onValueChange={v => { setFilterProperty(v === '_all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-9 rounded-full bg-[#f1f4f8] border-transparent text-[13px] w-40">
                <SelectValue placeholder="Propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas las propiedades</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Pending filter */}
          <button
            onClick={() => { setFilterPending(v => !v); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium transition-all ${
              filterPending
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-[#f1f4f8] text-slate-500 hover:bg-[#e2e8f0]'
            }`}
          >
            <Filter className="h-3 w-3" />
            Con pendiente
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eef2f7] rounded-[18px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Huésped</th>
                <th className="text-left font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Fechas</th>
                <th className="text-left font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Canal</th>
                <th className="text-right font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Bruto</th>
                <th className="text-right font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Cargos</th>
                <th className="text-right font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Comisiones</th>
                <th className="text-right font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Neto</th>
                <th className="text-right font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Cobrado / Pendiente</th>
                <th className="text-left font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Estado</th>
                <th className="text-right font-mono text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium px-4 py-3.5 border-b border-[#eef2f7] bg-[#fafbfc] whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 text-[13px]">
                    Cargando reservas...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 text-[13px]">
                    No hay reservas con los filtros actuales
                  </td>
                </tr>
              ) : (
                reservations.map(r => {
                  const channelStyle = r.channel ? (CHANNEL_STYLES[r.channel.code] ?? CHANNEL_STYLES.manual) : CHANNEL_STYLES.manual
                  const statusStyle = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                  const netPending = Math.max(0, round2(r.net_amount - r.total_received))
                  const progressPct = r.net_amount > 0 ? Math.min(100, (r.total_received / r.net_amount) * 100) : 0

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#fafbfc] transition-colors border-b border-[#eef2f7] last:border-b-0"
                    >
                      {/* Huésped */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#2dd4bf] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {r.guest_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{r.guest_name}</p>
                            {r.guest_country && (
                              <p className="text-[11px] text-slate-400 font-mono">{r.guest_country}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fechas */}
                      <td className="px-4 py-3.5">
                        <p className="text-slate-800">{formatDate(r.checkin_date)} → {formatDate(r.checkout_date)}</p>
                        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.08em] mt-0.5">{r.nights} noches</p>
                      </td>

                      {/* Canal */}
                      <td className="px-4 py-3.5">
                        {r.channel ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: channelStyle.bg, color: channelStyle.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: channelStyle.dot }} />
                            {r.channel.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[12px]">—</span>
                        )}
                      </td>

                      {/* Bruto */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        €{fmt(r.gross_amount)}
                      </td>

                      {/* Cargos */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-600 whitespace-nowrap">
                        {r.total_charges > 0 ? `€${fmt(r.total_charges)}` : '—'}
                      </td>

                      {/* Comisiones con tooltip de desglose */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="group relative inline-block"
                          title={`Comisión venta: ${fmt(r.total_sale_commission)}€ + IVA ${fmt(r.total_sale_commission_vat)}€${r.total_pay_commission > 0 ? ` / Cobro: ${fmt(r.total_pay_commission)}€ + IVA ${fmt(r.total_pay_commission_vat)}€` : ''}`}
                        >
                          <span className="font-mono font-semibold text-rose-600 cursor-help underline decoration-dotted">
                            {r.commission_total > 0 ? `-€${fmt(r.commission_total)}` : '—'}
                          </span>
                          {r.commission_total > 0 && (
                            <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-50 bg-[#1e3a8a] text-white text-[11px] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap min-w-[180px]">
                              <p className="font-mono mb-1 opacity-60 text-[10px] uppercase tracking-wider">Desglose</p>
                              {r.total_sale_commission > 0 && (
                                <p>Venta: {fmt(r.total_sale_commission)}€</p>
                              )}
                              {r.total_sale_commission_vat > 0 && (
                                <p className="opacity-70">IVA venta: {fmt(r.total_sale_commission_vat)}€</p>
                              )}
                              {r.total_pay_commission > 0 && (
                                <p>Cobro: {fmt(r.total_pay_commission)}€</p>
                              )}
                              {r.total_pay_commission_vat > 0 && (
                                <p className="opacity-70">IVA cobro: {fmt(r.total_pay_commission_vat)}€</p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Neto */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#1e3a8a] whitespace-nowrap">
                        €{fmt(r.net_amount)}
                      </td>

                      {/* Cobrado / Pendiente */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#047857]">€{fmt(r.total_received)}</span>
                            {netPending > 0 && (
                              <span className="font-mono font-semibold text-amber-600">€{fmt(netPending)}</span>
                            )}
                          </div>
                          <div className="h-1 w-20 bg-[#f1f4f8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1e3a8a] rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase whitespace-nowrap"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                          {STATUS_LABELS[r.status as ReservationStatus]}
                        </span>
                      </td>
                      {/* Acciones */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {r.is_locked && (
                            <span title="Reserva cerrada — cobro completo" className="mr-1">
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            </span>
                          )}
                          {/* Ver detalle */}
                          <button
                            onClick={() => openDrawer(r.id)}
                            title="Ver detalle"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#eef2fb] hover:text-[#1e3a8a] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {/* Editar */}
                          {canEdit && (
                            <Link
                              href={`/dashboard/bookings/new?edit=${r.id}`}
                              title={r.is_locked ? 'Editar (solo notas)' : 'Editar reserva'}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#eef2fb] hover:text-[#1e3a8a] transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          {/* Eliminar */}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(r)}
                              title="Eliminar reserva"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Footer totals */}
            {reservations.length > 0 && !loading && (
              <tfoot>
                <tr className="bg-[#f1f4f8]">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-[12px] text-slate-600">
                    {reservations.length} reservas mostradas
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">€{fmt(grossTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-600 whitespace-nowrap">€{fmt(reservations.reduce((s, r) => s + r.total_charges, 0))}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                    -{`€${fmt(reservations.reduce((s, r) => s + r.commission_total, 0))}`}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#1e3a8a] whitespace-nowrap">€{fmt(netTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 whitespace-nowrap">€{fmt(pendingTotal)}</td>
                  <td />
                  <td />
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#eef2f7]">
            <span className="text-[12px] text-slate-400 font-mono">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8"
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reservation Drawer */}
      <ReservationDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        paymentMethods={paymentMethods}
        canEdit={canEdit}
        canCancel={canCancel}
        onEditClick={(id) => {
          setDrawerOpen(false)
          window.location.href = `/dashboard/bookings/new?edit=${id}`
        }}
        onReservationUpdated={handleReservationUpdated}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px] z-[200]"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.25)] pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-[#eef2f7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-0.5">Confirmar eliminación</p>
                    <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">Eliminar reserva</h2>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-[14px] text-slate-700">
                  ¿Eliminar la reserva de <span className="font-semibold">{deleteTarget.guest_name}</span>?
                </p>
                {(deleteTarget.total_received > 0 || deleteTarget.total_charges > 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800 space-y-1">
                    {deleteTarget.total_received > 0 && (
                      <p>· Se eliminarán <span className="font-semibold">{deleteTarget.total_received.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span> en cobros registrados</p>
                    )}
                    {deleteTarget.total_charges > 0 && (
                      <p>· Se eliminarán los cargos asociados</p>
                    )}
                  </div>
                )}
                {deleteTarget.is_locked && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-[13px] text-rose-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Esta reserva está cerrada. Su eliminación afectará el saldo de las cuentas asociadas.</span>
                  </div>
                )}
                <p className="text-[12px] text-slate-400">Esta acción no se puede deshacer.</p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex justify-end gap-2.5 border-t border-[#eef2f7] pt-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full text-[13px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full text-[13px] font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KPI({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="px-5 py-4 border-r border-[#eef2f7] last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-2">{label}</p>
      <p className={`text-[24px] font-bold tracking-[-0.025em] leading-none ${valueClass === 'pending' ? 'text-amber-600' : 'text-slate-800'}`}>
        {value}
      </p>
      <p className="text-[11px] text-slate-400 mt-1.5 font-mono tracking-[0.04em]">{sub}</p>
    </div>
  )
}
