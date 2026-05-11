'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileCard } from '@/components/ui/mobile-card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReservationDrawer } from '@/components/dashboard/reservations/ReservationDrawer'
import { getReservations, getReservation } from '@/app/actions/reservations'
import { getPaymentMethods, getChannels } from '@/app/actions/reservation-settings'
import { getProperties } from '@/app/actions/properties'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import type {
  ReservationListItem,
  ReservationWithDetails,
  ChannelSetting,
  PaymentMethodSetting,
} from '@/types/reservations'

// ─── Channel colors ───────────────────────────────────────────────────────────
const CHANNEL_COLORS: Record<string, string> = {
  airbnb:   '#e11d48',
  booking:  '#1d4ed8',
  direct:   '#0d9488',
  manual:   '#94a3b8',
}

function getChannelColor(code: string): string {
  return CHANNEL_COLORS[code] ?? CHANNEL_COLORS.manual
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { profile } = useUserProfile()
  const canEdit   = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'edit') : false
  const canCancel = profile ? can(profile.tenant_role as TenantRole, 'reservations', 'cancel') : false

  const searchParams = useSearchParams()
  const globalYearParam = searchParams.get('year')
  const globalYear = (globalYearParam && globalYearParam !== 'all')
    ? parseInt(globalYearParam, 10) : null

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  useEffect(() => {
    if (globalYear === null) return
    setYear(globalYear)
    setMonth(globalYear === now.getFullYear() ? now.getMonth() : 0)
  }, [globalYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const [reservations, setReservations] = useState<ReservationListItem[]>([])
  const [channels, setChannels] = useState<ChannelSetting[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([])
  const [filterProperty, setFilterProperty] = useState('')
  const [loading, setLoading] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null)

  useEffect(() => {
    Promise.all([getChannels(), getPaymentMethods(), getProperties()]).then(
      ([{ channels: chs }, { methods }, props]) => {
        setChannels(chs)
        setPaymentMethods(methods)
        setProperties((props as unknown as { id: string; name: string }[]) ?? [])
      }
    )
  }, [])

  useEffect(() => {
    setLoading(true)
    // Traer reservas que estén ACTIVAS en algún día del mes:
    // checkin_date <= último día del mes  AND  checkout_date >= primer día del mes
    // Esto incluye reservas que empezaron el mes anterior (ej: 27/06–05/07 en julio)
    const firstOfMonth = isoDate(year, month, 1)
    const lastOfMonth  = isoDate(year, month, daysInMonth(year, month))
    getReservations({
      checkout_from: firstOfMonth,   // checkout_date >= 1º del mes
      date_to:       lastOfMonth,    // checkin_date  <= último del mes
      property_id: filterProperty || undefined,
      per_page: 200,
    }).then(({ reservations: rows }) => {
      setReservations(rows)
      setLoading(false)
    })
  }, [year, month, filterProperty])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const openDrawer = async (id: string) => {
    const { reservation } = await getReservation(id)
    if (reservation) {
      setSelectedReservation(reservation)
      setDrawerOpen(true)
    }
  }

  const handleReservationUpdated = (updated: ReservationWithDetails) => {
    setSelectedReservation(updated)
  }

  const isMobile = useIsMobile()

  // Agenda: eventos (llegadas + salidas) dentro del rango del mes visible
  const monthFrom = isoDate(year, month, 1)
  const monthTo   = isoDate(year, month, daysInMonth(year, month))

  const agendaEvents = reservations.flatMap(r => [
    { date: r.checkin_date,  type: 'checkin'  as const, reservation: r },
    { date: r.checkout_date, type: 'checkout' as const, reservation: r },
  ])
    .filter(ev => ev.date >= monthFrom && ev.date <= monthTo)
    .sort((a, b) => a.date.localeCompare(b.date))

  const eventsByDate = agendaEvents.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []
    acc[ev.date].push(ev)
    return acc
  }, {} as Record<string, typeof agendaEvents>)

  function fmt(n: number) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function fmtAgendaDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  const totalDays = daysInMonth(year, month)
  const firstDay = firstDayOfWeek(year, month)

  const reservationsForDay = (day: number): ReservationListItem[] => {
    const date = isoDate(year, month, day)
    return reservations.filter(r => r.checkin_date <= date && r.checkout_date > date)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // Navegación de mes — bloque compartido mobile/desktop
  const MonthNav = () => (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" className="rounded-full h-9 w-9 p-0" onClick={prevMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-[14px] md:text-[15px] text-slate-800 min-w-[130px] md:min-w-[160px] text-center">
        {MONTH_NAMES[month]} {year}
      </span>
      <Button variant="outline" size="sm" className="rounded-full h-9 w-9 p-0" onClick={nextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">

      {/* ── Mobile header ── */}
      <div className="md:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Dashboard
          </p>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-[#1e3a8a] transition-colors"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Reservas
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-none">
            Calendario
          </h1>
          <MonthNav />
        </div>
        {properties.length > 1 && (
          <div className="mt-3">
            <Select value={filterProperty || '_all'} onValueChange={v => setFilterProperty(v === '_all' ? '' : v)}>
              <SelectTrigger className="h-9 rounded-full bg-white border-[#eef2f7] text-[13px] w-full">
                <SelectValue placeholder="Todas las propiedades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas las propiedades</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden md:flex justify-between items-end gap-8 mb-8 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Dashboard
          </p>
          <h1 className="text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
            Calendario
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Vista mensual de ocupación</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bookings">
            <Button variant="outline" className="rounded-full gap-2">
              <CalendarCheck className="h-4 w-4" />
              Lista de reservas
            </Button>
          </Link>
          {properties.length > 1 && (
            <Select value={filterProperty || '_all'} onValueChange={v => setFilterProperty(v === '_all' ? '' : v)}>
              <SelectTrigger className="h-9 rounded-full bg-white border-[#eef2f7] text-[13px] w-44">
                <SelectValue placeholder="Todas las propiedades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas las propiedades</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <MonthNav />
        </div>
      </div>

      {/* Legend — desktop only */}
      <div className="hidden md:flex items-center gap-4 mb-4 flex-wrap">
        {channels.filter(c => c.is_active).map(c => (
          <span key={c.id} className="flex items-center gap-1.5 text-[12px] text-slate-600">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: getChannelColor(c.code) }} />
            {c.name}
          </span>
        ))}
      </div>

      {/* Desktop: Calendar grid */}
      <div className="hidden md:block bg-white border border-[#eef2f7] rounded-[18px] overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-[#eef2f7]">
          {DAY_NAMES.map(d => (
            <div key={d} className="px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 border-r border-[#eef2f7] last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-[13px]">Cargando calendario...</div>
        ) : (
          Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-[#eef2f7] last:border-b-0" style={{ minHeight: 100 }}>
              {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                const dayReservations = day ? reservationsForDay(day) : []
                return (
                  <div
                    key={dayIdx}
                    className={`p-2 border-r border-[#eef2f7] last:border-r-0 min-h-[100px] ${!day ? 'bg-[#fafbfc]' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-[12px] font-mono font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                          isToday(day) ? 'bg-[#1e3a8a] text-white' : 'text-slate-500'
                        }`}>
                          {day}
                        </span>
                        <div className="space-y-0.5">
                          {dayReservations.slice(0, 4).map(r => {
                            const color = r.channel ? getChannelColor(r.channel.code) : getChannelColor('manual')
                            const isCheckin = r.checkin_date === isoDate(year, month, day)
                            return (
                              <button
                                key={r.id}
                                onClick={() => openDrawer(r.id)}
                                className="w-full text-left text-white text-[10px] font-medium px-1.5 py-0.5 truncate transition-opacity hover:opacity-80 block rounded"
                                style={{ background: color }}
                                title={r.guest_name}
                              >
                                {isCheckin ? r.guest_name : '·'}
                              </button>
                            )
                          })}
                          {dayReservations.length > 4 && (
                            <p className="text-[10px] text-slate-400 font-mono">+{dayReservations.length - 4}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Mobile: Agenda */}
      <div className="md:hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>
        ) : agendaEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#eef2f7] p-12 text-center shadow-sm">
            <p className="text-[15px] font-semibold text-slate-600 mb-1">Sin movimientos</p>
            <p className="text-[13px] text-slate-400">No hay llegadas ni salidas en {MONTH_NAMES[month]}</p>
          </div>
        ) : (
          <>
            {/* Resumen del mes */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-[#eef2f7] px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Llegadas</p>
                <p className="text-[22px] font-bold text-[#1e3a8a]">
                  {agendaEvents.filter(e => e.type === 'checkin').length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#eef2f7] px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Salidas</p>
                <p className="text-[22px] font-bold text-slate-600">
                  {agendaEvents.filter(e => e.type === 'checkout').length}
                </p>
              </div>
            </div>

            {/* Lista agrupada por fecha */}
            <div className="space-y-5">
              {Object.entries(eventsByDate).map(([date, events]) => (
                <div key={date}>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 capitalize">
                    {fmtAgendaDate(date)}
                  </p>
                  <div className="space-y-2">
                    {events.map((ev, i) => {
                      const color = ev.reservation.channel
                        ? getChannelColor(ev.reservation.channel.code)
                        : getChannelColor('manual')
                      const isCheckin = ev.type === 'checkin'
                      return (
                        <MobileCard key={i} onClick={() => openDrawer(ev.reservation.id)}>
                          <div className="flex items-center gap-3">
                            {/* Indicador color: checkin = color canal, checkout = gris */}
                            <div
                              className="w-1.5 h-10 rounded-full flex-shrink-0"
                              style={{ background: isCheckin ? color : '#cbd5e1' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                                  isCheckin
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {isCheckin ? '→ Llegada' : '← Salida'}
                                </span>
                                {ev.reservation.channel && (
                                  <span className="text-[10px] text-slate-400">
                                    {ev.reservation.channel.name}
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-[13px] text-slate-800 truncate">
                                {ev.reservation.guest_name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {ev.reservation.nights} noches
                                {ev.reservation.guest_country && ` · ${ev.reservation.guest_country}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-[13px] font-semibold text-[#1e3a8a]">
                                €{fmt(ev.reservation.net_amount)}
                              </p>
                              {isCheckin && ev.reservation.pending_amount > 0 && (
                                <p className="text-[10px] text-amber-600 font-mono">
                                  pdte €{fmt(ev.reservation.pending_amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        </MobileCard>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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
    </div>
  )
}
