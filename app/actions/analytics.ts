'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { EXPENSE_CATEGORY_LABELS } from '@/types/expenses'
import type {
  DashboardKPIs,
  AnalyticsKPIs,
  MonthlyDataPoint,
  ChannelDataPoint,
  ExpenseCategoryDataPoint,
  ProjectionDataPoint,
  RecentActivity,
  PropertyStatus,
} from '@/types/analytics'

export { getGuestChats } from './analytics-chat'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function trend(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100 * 10) / 10
}

function calcOccupancyDays(
  reservations: { checkin_date: string; checkout_date: string }[],
  periodStart: Date,
  periodEnd: Date
): number {
  let days = 0
  for (const r of reservations) {
    const checkin  = new Date(r.checkin_date)
    const checkout = new Date(r.checkout_date)
    const start = checkin  > periodStart ? checkin  : periodStart
    const end   = checkout < periodEnd   ? checkout : periodEnd
    const diff = (end.getTime() - start.getTime()) / 86400000
    if (diff > 0) days += diff
  }
  return days
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffH  = Math.floor(diffMs / 3600000)
  const diffD  = Math.floor(diffMs / 86400000)
  if (diffH < 1)  return 'hace unos minutos'
  if (diffH < 24) return `hace ${diffH}h`
  if (diffD === 1) return 'ayer'
  return `hace ${diffD} días`
}

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()

  const currStart = toDateStr(new Date(year, month, 1))
  const currEnd   = toDateStr(new Date(year, month + 1, 0))
  const prevStart = toDateStr(new Date(year, month - 1, 1))
  const prevEnd   = toDateStr(new Date(year, month, 0))

  const statusFilter = ['confirmed', 'checked_in', 'checked_out', 'pending']

  // Reservas del mes actual y anterior
  const [{ data: currRes }, { data: prevRes }] = await Promise.all([
    supabase.from('reservations').select('id, checkin_date, checkout_date, gross_amount, total_sale_commission, total_sale_commission_vat, total_pay_commission, total_pay_commission_vat')
      .eq('tenant_id', tenant_id).in('status', statusFilter)
      .gte('checkin_date', currStart).lte('checkin_date', currEnd),
    supabase.from('reservations').select('id, checkin_date, checkout_date, gross_amount, total_sale_commission, total_sale_commission_vat, total_pay_commission, total_pay_commission_vat')
      .eq('tenant_id', tenant_id).in('status', statusFilter)
      .gte('checkin_date', prevStart).lte('checkin_date', prevEnd),
  ])

  // Huéspedes activos ahora
  const today = toDateStr(now)
  const { count: activeNow } = await supabase.from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id).eq('status', 'confirmed')
    .lte('checkin_date', today).gte('checkout_date', today)

  // Propiedades activas
  const { count: activePropCount } = await supabase.from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id).eq('status', 'active')

  const propCount = activePropCount ?? 1

  // Calcular ingresos netos
  const netIncome = (rows: typeof currRes) =>
    (rows ?? []).reduce((s, r) =>
      s + (r.gross_amount ?? 0)
        - (r.total_sale_commission ?? 0)
        - (r.total_sale_commission_vat ?? 0)
        - (r.total_pay_commission ?? 0)
        - (r.total_pay_commission_vat ?? 0), 0)

  const currNet  = netIncome(currRes)
  const prevNet  = netIncome(prevRes)
  const currGross = (currRes ?? []).reduce((s, r) => s + (r.gross_amount ?? 0), 0)

  // Ocupación mes actual
  const daysThisMonth = daysInMonth(year, month)
  const availableDays = daysThisMonth * propCount
  const occDays = calcOccupancyDays(currRes ?? [], new Date(year, month, 1), new Date(year, month + 1, 0))
  const occupancy = availableDays > 0 ? Math.round((occDays / availableDays) * 100) : 0

  // Ocupación mes anterior
  const daysPrevMonth = daysInMonth(year, month - 1 < 0 ? 11 : month - 1)
  const prevOccDays = calcOccupancyDays(prevRes ?? [], new Date(year, month - 1, 1), new Date(year, month, 0))
  const prevOccupancy = (daysPrevMonth * propCount) > 0
    ? Math.round((prevOccDays / (daysPrevMonth * propCount)) * 100) : 0

  // Huéspedes activos mismo día del mes anterior (aproximación: count del mes anterior)
  const prevActiveNow = prevRes?.length ?? 0

  return {
    reservations_this_month:       currRes?.length ?? 0,
    reservations_this_month_trend: trend(currRes?.length ?? 0, prevRes?.length ?? 0),
    occupancy_this_month:          occupancy,
    occupancy_this_month_trend:    trend(occupancy, prevOccupancy),
    active_guests_now:             activeNow ?? 0,
    active_guests_trend:           trend(activeNow ?? 0, prevActiveNow),
    net_income_this_month:         Math.round(currNet * 100) / 100,
    net_income_this_month_trend:   trend(currNet, prevNet),
    gross_income_this_month:       Math.round(currGross * 100) / 100,
  }
}

export async function getPropertyStatuses(): Promise<PropertyStatus[]> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const { data: props } = await supabase.from('properties')
    .select('id, name, full_address, main_image_url, city, country')
    .eq('tenant_id', tenant_id).eq('status', 'active')
    .order('created_at', { ascending: true })

  if (!props?.length) return []

  const today = toDateStr(new Date())
  const in7   = toDateStr(new Date(Date.now() + 7 * 86400000))

  const { data: reservations } = await supabase.from('reservations')
    .select('id, property_id, guest_name, checkin_date, checkout_date, status')
    .eq('tenant_id', tenant_id).eq('status', 'confirmed')
    .lte('checkin_date', in7).gte('checkout_date', today)

  const result: PropertyStatus[] = props.map(p => {
    const propRes = (reservations ?? []).filter(r => r.property_id === p.id)

    const occupied = propRes.find(r => r.checkin_date <= today && r.checkout_date >= today)
    if (occupied) {
      return {
        id: p.id, name: p.name,
        location: p.city ? `${p.city}${p.country ? ', ' + p.country : ''}` : (p.full_address ?? ''),
        image_url: p.main_image_url,
        current_status: 'occupied',
        next_checkout: occupied.checkout_date,
        next_checkin: null,
        current_guest: occupied.guest_name,
      }
    }

    const upcoming = propRes.find(r => r.checkin_date > today && r.checkin_date <= in7)
    if (upcoming) {
      return {
        id: p.id, name: p.name,
        location: p.city ? `${p.city}${p.country ? ', ' + p.country : ''}` : (p.full_address ?? ''),
        image_url: p.main_image_url,
        current_status: 'upcoming',
        next_checkout: null,
        next_checkin: upcoming.checkin_date,
        current_guest: null,
      }
    }

    return {
      id: p.id, name: p.name,
      location: p.city ? `${p.city}${p.country ? ', ' + p.country : ''}` : (p.full_address ?? ''),
      image_url: p.main_image_url,
      current_status: 'available',
      next_checkout: null,
      next_checkin: null,
      current_guest: null,
    }
  })

  return result
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const since14 = new Date(Date.now() - 14 * 86400000).toISOString()
  const today   = toDateStr(new Date())
  const since14Date = toDateStr(new Date(Date.now() - 14 * 86400000))

  const [{ data: newRes }, { data: checkouts }, { data: expenses }] = await Promise.all([
    supabase.from('reservations')
      .select('id, guest_name, created_at, properties(name)')
      .eq('tenant_id', tenant_id)
      .gte('created_at', since14)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('reservations')
      .select('id, guest_name, checkout_date, properties(name)')
      .eq('tenant_id', tenant_id)
      .in('status', ['confirmed', 'checked_out'])
      .gte('checkout_date', since14Date).lte('checkout_date', today)
      .order('checkout_date', { ascending: false }).limit(5),
    supabase.from('expenses')
      .select('id, description, total_amount, created_at')
      .eq('tenant_id', tenant_id)
      .gte('created_at', since14)
      .order('created_at', { ascending: false }).limit(5),
  ])

  const items: Array<RecentActivity & { _date: Date }> = []

  for (const r of newRes ?? []) {
    const propName = (r.properties as unknown as { name: string } | null)?.name ?? 'Propiedad'
    items.push({
      id: `res-${r.id}`,
      type: 'new_reservation',
      title: `Nueva reserva — ${propName}`,
      subtitle: r.guest_name,
      time_ago: timeAgo(new Date(r.created_at)),
      href: `/dashboard/bookings/${r.id}`,
      _date: new Date(r.created_at),
    })
  }

  for (const r of checkouts ?? []) {
    const propName = (r.properties as unknown as { name: string } | null)?.name ?? 'Propiedad'
    const d = new Date(r.checkout_date)
    items.push({
      id: `out-${r.id}`,
      type: 'checkout',
      title: `Check-out — ${propName}`,
      subtitle: r.guest_name,
      time_ago: timeAgo(d),
      href: `/dashboard/bookings/${r.id}`,
      _date: d,
    })
  }

  for (const e of expenses ?? []) {
    const amt = (e.total_amount ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })
    items.push({
      id: `exp-${e.id}`,
      type: 'expense',
      title: e.description,
      subtitle: `€${amt}`,
      time_ago: timeAgo(new Date(e.created_at)),
      href: `/dashboard/expenses/${e.id}/edit`,
      _date: new Date(e.created_at),
    })
  }

  return items
    .sort((a, b) => b._date.getTime() - a._date.getTime())
    .slice(0, 10)
    .map(({ _date: _, ...rest }) => rest)
}

// ─── ANALÍTICAS ───────────────────────────────────────────────────────────────

export async function getAnalyticsKPIs(filters: {
  year: number | 'all'
  property_id?: string
}): Promise<AnalyticsKPIs> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const statusFilter = ['confirmed', 'checked_in', 'checked_out', 'pending']

  function buildResQuery(yearFilter: number | 'all') {
    let q = supabase.from('reservations')
      .select('id, checkin_date, checkout_date, gross_amount, total_sale_commission, total_sale_commission_vat, total_pay_commission, total_pay_commission_vat, created_at')
      .eq('tenant_id', tenant_id).in('status', statusFilter)
    if (yearFilter !== 'all') {
      q = q.gte('checkin_date', `${yearFilter}-01-01`).lte('checkin_date', `${yearFilter}-12-31`)
    }
    if (filters.property_id && filters.property_id !== 'all') {
      q = q.eq('property_id', filters.property_id)
    }
    return q
  }

  function buildExpQuery(yearFilter: number | 'all') {
    let q = supabase.from('expenses')
      .select('total_amount, expense_date')
      .eq('tenant_id', tenant_id)
    if (yearFilter !== 'all') {
      q = q.gte('expense_date', `${yearFilter}-01-01`).lte('expense_date', `${yearFilter}-12-31`)
    }
    if (filters.property_id && filters.property_id !== 'all') {
      q = q.eq('property_id', filters.property_id)
    }
    return q
  }

  const prevYear = typeof filters.year === 'number' ? filters.year - 1 : null

  const [{ data: currRes }, { data: currExp }, { data: prevRes }, { data: prevExp }, { count: activePropCount }] = await Promise.all([
    buildResQuery(filters.year),
    buildExpQuery(filters.year),
    prevYear ? buildResQuery(prevYear) : Promise.resolve({ data: [] }),
    prevYear ? buildExpQuery(prevYear) : Promise.resolve({ data: [] }),
    supabase.from('properties').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id).eq('status', 'active'),
  ])

  const propCount = (filters.property_id && filters.property_id !== 'all') ? 1 : (activePropCount ?? 1)

  function calcMetrics(rows: typeof currRes, expRows: typeof currExp, yearFilter: number | 'all') {
    const gross = (rows ?? []).reduce((s, r) => s + (r.gross_amount ?? 0), 0)
    const net   = (rows ?? []).reduce((s, r) =>
      s + (r.gross_amount ?? 0)
        - (r.total_sale_commission ?? 0) - (r.total_sale_commission_vat ?? 0)
        - (r.total_pay_commission ?? 0)  - (r.total_pay_commission_vat ?? 0), 0)
    const totalExp = (expRows ?? []).reduce((s, e) => s + (e.total_amount ?? 0), 0)
    const real  = net - totalExp
    const count = rows?.length ?? 0

    // Días disponibles
    let availDays = 0
    let occDays   = 0
    let totalNights = 0

    if (yearFilter !== 'all') {
      availDays = daysInMonth(yearFilter, 0) // Jan
      let d = 0
      for (let m = 0; m < 12; m++) d += daysInMonth(yearFilter, m)
      availDays = d * propCount

      for (const r of rows ?? []) {
        const c = new Date(r.checkin_date)
        const o = new Date(r.checkout_date)
        const nights = Math.max(0, (o.getTime() - c.getTime()) / 86400000)
        totalNights += nights
        occDays += calcOccupancyDays([r],
          new Date(`${yearFilter}-01-01`),
          new Date(`${yearFilter}-12-31`))
      }
    } else {
      for (const r of rows ?? []) {
        const c = new Date(r.checkin_date)
        const o = new Date(r.checkout_date)
        totalNights += Math.max(0, (o.getTime() - c.getTime()) / 86400000)
        occDays += Math.max(0, (o.getTime() - c.getTime()) / 86400000)
      }
      availDays = occDays > 0 ? occDays * 3 : 1 // aproximación sin período fijo
    }

    const occ = availDays > 0 ? Math.round((occDays / availDays) * 100) : 0
    const adr = totalNights > 0 ? gross / totalNights : 0
    const revpar = availDays > 0 ? gross / availDays : 0
    const margin = gross > 0 ? (real / gross) * 100 : 0

    const leadTimes = (rows ?? [])
      .filter(r => r.created_at)
      .map(r => {
        const c = new Date(r.checkin_date)
        const cr = new Date(r.created_at)
        return Math.max(0, (c.getTime() - cr.getTime()) / 86400000)
      })
    const avgLead = leadTimes.length > 0
      ? Math.round(leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length)
      : null

    const avgStay = count > 0 ? totalNights / count : 0

    return { gross, net, totalExp, real, count, occ, adr, revpar, margin, avgLead, avgStay }
  }

  const curr = calcMetrics(currRes, currExp, filters.year)
  const prev = prevYear ? calcMetrics(prevRes, prevExp, prevYear) : null

  return {
    total_reservations:  curr.count,
    total_gross_income:  Math.round(curr.gross * 100) / 100,
    total_net_income:    Math.round(curr.net * 100) / 100,
    total_real_income:   Math.round(curr.real * 100) / 100,
    total_expenses:      Math.round(curr.totalExp * 100) / 100,
    net_margin_pct:      Math.round(curr.margin * 10) / 10,
    avg_daily_rate:      Math.round(curr.adr * 100) / 100,
    revpar:              Math.round(curr.revpar * 100) / 100,
    occupancy_rate:      curr.occ,
    avg_stay_duration:   Math.round(curr.avgStay * 10) / 10,
    avg_lead_time:       curr.avgLead,
    vs_previous: {
      reservations: prev ? trend(curr.count,   prev.count)  : null,
      gross_income: prev ? trend(curr.gross,   prev.gross)  : null,
      occupancy:    prev ? trend(curr.occ,     prev.occ)    : null,
      net_margin:   prev ? trend(curr.margin,  prev.margin) : null,
    },
  }
}

export async function getMonthlyBreakdown(filters: {
  year: number | 'all'
  property_id?: string
}): Promise<MonthlyDataPoint[]> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const statusFilter = ['confirmed', 'checked_in', 'checked_out', 'pending']

  let resQ = supabase.from('reservations')
    .select('checkin_date, checkout_date, gross_amount, total_sale_commission, total_sale_commission_vat, total_pay_commission, total_pay_commission_vat')
    .eq('tenant_id', tenant_id).in('status', statusFilter)

  let expQ = supabase.from('expenses')
    .select('total_amount, expense_date')
    .eq('tenant_id', tenant_id)

  if (filters.year !== 'all') {
    resQ = resQ.gte('checkin_date', `${filters.year}-01-01`).lte('checkin_date', `${filters.year}-12-31`)
    expQ = expQ.gte('expense_date', `${filters.year}-01-01`).lte('expense_date', `${filters.year}-12-31`)
  } else {
    const cutoff = `${new Date().getFullYear() - 2}-01-01`
    resQ = resQ.gte('checkin_date', cutoff)
    expQ = expQ.gte('expense_date', cutoff)
  }

  if (filters.property_id && filters.property_id !== 'all') {
    resQ = resQ.eq('property_id', filters.property_id)
    expQ = expQ.eq('property_id', filters.property_id)
  }

  const { count: propCount } = await supabase.from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id).eq('status', 'active')

  const pc = (filters.property_id && filters.property_id !== 'all') ? 1 : (propCount ?? 1)

  const [{ data: reservations }, { data: expenses }] = await Promise.all([resQ, expQ])

  // Construir mapa de meses
  const monthMap: Record<string, MonthlyDataPoint> = {}

  function getKey(year: number, month: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}`
  }

  // Pre-poblar meses
  if (filters.year !== 'all') {
    for (let m = 0; m < 12; m++) {
      const key = getKey(filters.year as number, m)
      monthMap[key] = { month: key, month_label: MONTH_LABELS[m], gross_income: 0, net_income: 0, expenses: 0, real_margin: 0, occupancy_rate: 0, reservations_count: 0 }
    }
  } else {
    const now = new Date()
    for (let i = 35; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = getKey(d.getFullYear(), d.getMonth())
      if (!monthMap[key]) monthMap[key] = { month: key, month_label: MONTH_LABELS[d.getMonth()], gross_income: 0, net_income: 0, expenses: 0, real_margin: 0, occupancy_rate: 0, reservations_count: 0 }
    }
  }

  for (const r of reservations ?? []) {
    const d = new Date(r.checkin_date)
    const key = getKey(d.getFullYear(), d.getMonth())
    if (!monthMap[key]) continue
    const pt = monthMap[key]
    pt.gross_income      += r.gross_amount ?? 0
    pt.net_income        += (r.gross_amount ?? 0) - (r.total_sale_commission ?? 0) - (r.total_sale_commission_vat ?? 0) - (r.total_pay_commission ?? 0) - (r.total_pay_commission_vat ?? 0)
    pt.reservations_count += 1

    // Ocupación
    const year  = d.getFullYear()
    const month = d.getMonth()
    const pStart = new Date(year, month, 1)
    const pEnd   = new Date(year, month + 1, 0)
    const days   = daysInMonth(year, month) * pc
    const occ    = calcOccupancyDays([r], pStart, pEnd)
    pt.occupancy_rate += days > 0 ? (occ / days) * 100 : 0
  }

  // Normalizar ocupación (no acumular, ya está como %)
  for (const pt of Object.values(monthMap)) {
    if (pt.reservations_count > 0) {
      // La ocupación ya está calculada acumulando días, dividir por días del mes
      // Recalcular limpio
    }
  }

  for (const e of expenses ?? []) {
    const d = new Date(e.expense_date)
    const key = getKey(d.getFullYear(), d.getMonth())
    if (monthMap[key]) monthMap[key].expenses += e.total_amount ?? 0
  }

  // Recalcular ocupación y margen correctamente
  const occByMonth: Record<string, { occ: number; avail: number }> = {}
  for (const r of reservations ?? []) {
    const d     = new Date(r.checkin_date)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const key   = getKey(year, month)
    if (!occByMonth[key]) occByMonth[key] = { occ: 0, avail: daysInMonth(year, month) * pc }
    occByMonth[key].occ += calcOccupancyDays([r], new Date(year, month, 1), new Date(year, month + 1, 0))
  }

  for (const [key, pt] of Object.entries(monthMap)) {
    const o = occByMonth[key]
    pt.occupancy_rate = o && o.avail > 0 ? Math.round((o.occ / o.avail) * 100) : 0
    pt.gross_income   = Math.round(pt.gross_income * 100) / 100
    pt.net_income     = Math.round(pt.net_income   * 100) / 100
    pt.expenses       = Math.round(pt.expenses     * 100) / 100
    pt.real_margin    = Math.round((pt.net_income - pt.expenses) * 100) / 100
  }

  return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))
}

export async function getChannelBreakdown(filters: {
  year: number | 'all'
  property_id?: string
}): Promise<ChannelDataPoint[]> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const statusFilter = ['confirmed', 'checked_in', 'checked_out', 'pending']

  let q = supabase.from('reservations')
    .select('channel_id, gross_amount, channel_settings(name, code)')
    .eq('tenant_id', tenant_id).in('status', statusFilter)

  if (filters.year !== 'all') {
    q = q.gte('checkin_date', `${filters.year}-01-01`).lte('checkin_date', `${filters.year}-12-31`)
  }
  if (filters.property_id && filters.property_id !== 'all') {
    q = q.eq('property_id', filters.property_id)
  }

  const { data } = await q

  const map: Record<string, ChannelDataPoint> = {}
  let totalGross = 0

  for (const r of data ?? []) {
    const ch = r.channel_settings as unknown as { name: string; code: string } | null
    const key = r.channel_id ?? 'unknown'
    if (!map[key]) {
      map[key] = {
        channel_name: ch?.name ?? 'Sin canal',
        channel_code: ch?.code ?? 'manual',
        reservations: 0,
        gross_income: 0,
        percentage: 0,
      }
    }
    map[key].reservations  += 1
    map[key].gross_income  += r.gross_amount ?? 0
    totalGross             += r.gross_amount ?? 0
  }

  return Object.values(map)
    .map(c => ({ ...c, gross_income: Math.round(c.gross_income * 100) / 100, percentage: totalGross > 0 ? Math.round((c.gross_income / totalGross) * 1000) / 10 : 0 }))
    .sort((a, b) => b.gross_income - a.gross_income)
}

export async function getExpenseBreakdown(filters: {
  year: number | 'all'
  property_id?: string
}): Promise<ExpenseCategoryDataPoint[]> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  let q = supabase.from('expenses')
    .select('category, total_amount')
    .eq('tenant_id', tenant_id)

  if (filters.year !== 'all') {
    q = q.gte('expense_date', `${filters.year}-01-01`).lte('expense_date', `${filters.year}-12-31`)
  }
  if (filters.property_id && filters.property_id !== 'all') {
    q = q.eq('property_id', filters.property_id)
  }

  const { data } = await q

  const map: Record<string, number> = {}
  let total = 0
  for (const e of data ?? []) {
    map[e.category] = (map[e.category] ?? 0) + (e.total_amount ?? 0)
    total += e.total_amount ?? 0
  }

  const sorted = Object.entries(map)
    .map(([cat, amt]) => ({ cat, amt }))
    .sort((a, b) => b.amt - a.amt)

  const top8 = sorted.slice(0, 8)
  const rest = sorted.slice(8).reduce((s, x) => s + x.amt, 0)

  const result: ExpenseCategoryDataPoint[] = top8.map(({ cat, amt }) => ({
    category: cat,
    category_label: EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS] ?? cat,
    total: Math.round(amt * 100) / 100,
    percentage: total > 0 ? Math.round((amt / total) * 1000) / 10 : 0,
  }))

  if (rest > 0) {
    result.push({ category: 'other_grouped', category_label: 'Otros', total: Math.round(rest * 100) / 100, percentage: total > 0 ? Math.round((rest / total) * 1000) / 10 : 0 })
  }

  return result
}

export async function getProjection(): Promise<ProjectionDataPoint[]> {
  const supabase = await createClient()
  const { tenant_id } = await requireProfile(supabase)

  const now   = new Date()
  const result: ProjectionDataPoint[] = []

  // Templates recurrentes activos
  const { data: templates } = await supabase.from('recurring_expense_templates')
    .select('frequency, day_of_period, month_of_year, estimated_amount, vat_pct, start_date, end_date, is_active')
    .eq('tenant_id', tenant_id).eq('is_active', true)

  for (let i = 0; i < 6; i++) {
    const d     = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const mStart = toDateStr(new Date(year, month, 1))
    const mEnd   = toDateStr(new Date(year, month + 1, 0))
    const key    = `${year}-${String(month + 1).padStart(2, '0')}`

    // Ingresos confirmados del mes
    const { data: resData, count: resCount } = await supabase.from('reservations')
      .select('gross_amount', { count: 'exact' })
      .eq('tenant_id', tenant_id).eq('status', 'confirmed')
      .gte('checkin_date', mStart).lte('checkin_date', mEnd)

    const projIncome = (resData ?? []).reduce((s, r) => s + (r.gross_amount ?? 0), 0)

    // Gastos proyectados desde templates
    let projExp = 0
    for (const tpl of templates ?? []) {
      const start = new Date(tpl.start_date as string)
      const end   = tpl.end_date ? new Date(tpl.end_date as string) : null
      if (start > d || (end && end < d)) continue

      const freq = tpl.frequency as string
      const monthOfYear = tpl.month_of_year as number | null

      let applies = false
      if (freq === 'monthly') applies = true
      if (freq === 'quarterly') applies = month % 3 === start.getMonth() % 3
      if (freq === 'annual')   applies = monthOfYear !== null ? month === (monthOfYear - 1) : month === start.getMonth()

      if (applies) {
        const vat = Math.round((tpl.estimated_amount ?? 0) * (tpl.vat_pct ?? 0)) / 100
        projExp += (tpl.estimated_amount ?? 0) + vat
      }
    }

    result.push({
      month: key,
      month_label: `${MONTH_LABELS[month]} ${year}`,
      projected_income:       Math.round(projIncome * 100) / 100,
      projected_expenses:     Math.round(projExp * 100) / 100,
      projected_margin:       Math.round((projIncome - projExp) * 100) / 100,
      confirmed_reservations: resCount ?? 0,
      is_current_month:       i === 0,
    })
  }

  return result
}
