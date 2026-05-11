export type DisplayStatus =
  | 'upcoming'     // Próxima — checkin en el futuro
  | 'in_progress'  // En curso — huésped dentro ahora mismo
  | 'overdue'      // Sin cerrar — checkout pasado, no finalizada
  | 'finished'     // Finalizada — checked_out en BD
  | 'cancelled'    // Cancelada
  | 'no_show'      // No show

export function getDisplayStatus(reservation: {
  status: string
  checkin_date: string
  checkout_date: string
}): DisplayStatus {
  if (reservation.status === 'cancelled')   return 'cancelled'
  if (reservation.status === 'no_show')     return 'no_show'
  if (reservation.status === 'checked_out') return 'finished'

  // confirmed (y legacy pending/checked_in): derivar de fechas
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checkin  = new Date(reservation.checkin_date  + 'T00:00:00')
  const checkout = new Date(reservation.checkout_date + 'T00:00:00')

  if (today < checkin)  return 'upcoming'
  if (today > checkout) return 'overdue'
  return 'in_progress'
}

export const DISPLAY_STATUS_CONFIG: Record<DisplayStatus, {
  label: string
  bg: string
  color: string
  dot: string
}> = {
  upcoming:    { label: 'Próxima',     bg: '#eef2fb', color: '#1e3a8a', dot: '#3b82f6' },
  in_progress: { label: 'En curso',    bg: '#ecfdf5', color: '#047857', dot: '#10b981' },
  overdue:     { label: 'Sin cerrar',  bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  finished:    { label: 'Finalizada',  bg: '#f1f4f8', color: '#475569', dot: '#94a3b8' },
  cancelled:   { label: 'Cancelada',   bg: '#ffe4e6', color: '#e11d48', dot: '#e11d48' },
  no_show:     { label: 'No show',     bg: '#fef3c7', color: '#b45309', dot: '#d97706' },
}

// Traduce un DisplayStatus al filtro SQL equivalente
export function buildStatusFilter(displayStatus: DisplayStatus): {
  status?: string
  checkin_after?: string
  checkin_before_or_equal?: string
  checkout_after_or_equal?: string
  checkout_before?: string
} {
  const today = new Date().toISOString().split('T')[0]

  switch (displayStatus) {
    case 'upcoming':
      return { status: 'confirmed', checkin_after: today }
    case 'in_progress':
      return { status: 'confirmed', checkin_before_or_equal: today, checkout_after_or_equal: today }
    case 'overdue':
      return { status: 'confirmed', checkout_before: today }
    case 'finished':
      return { status: 'checked_out' }
    case 'cancelled':
      return { status: 'cancelled' }
    case 'no_show':
      return { status: 'no_show' }
  }
}

// Acciones disponibles según display status
export function getAvailableActions(reservation: {
  status: string
  checkin_date: string
  checkout_date: string
}): Array<'finalizar' | 'cancelar' | 'no_show'> {
  const ds = getDisplayStatus(reservation)
  switch (ds) {
    case 'upcoming':
    case 'in_progress':
      return ['finalizar', 'cancelar', 'no_show']
    case 'overdue':
      return ['finalizar', 'no_show']
    default:
      return []
  }
}
