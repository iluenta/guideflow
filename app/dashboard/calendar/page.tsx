'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    const dateFrom = isoDate(year, month, 1)
    const dateTo = isoDate(year, month, daysInMonth(year, month))
    getReservations({
      date_from: dateFrom,
      date_to: dateTo,
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

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end gap-8 mb-8 flex-wrap">
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

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="rounded-full h-9 w-9 p-0" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-[15px] text-slate-800 min-w-[160px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <Button variant="outline" size="sm" className="rounded-full h-9 w-9 p-0" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {channels.filter(c => c.is_active).map(c => (
          <span key={c.id} className="flex items-center gap-1.5 text-[12px] text-slate-600">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: getChannelColor(c.code) }} />
            {c.name}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-[#eef2f7] rounded-[18px] overflow-hidden shadow-sm">
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
