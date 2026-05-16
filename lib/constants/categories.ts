// Categorías de gasto / tipos de proveedor — fuente única de verdad.
// Usadas en: formulario de gastos, formulario de proveedores, filtros.

export const EXPENSE_CATEGORIES = [
  { value: 'cleaning',    label: 'Limpieza' },
  { value: 'laundry',     label: 'Lavandería' },
  { value: 'checkin',     label: 'Check-in / Check-out' },
  { value: 'maintenance', label: 'Mantenimiento y reparaciones' },
  { value: 'utilities',   label: 'Suministros (luz, agua, gas)' },
  { value: 'wifi',        label: 'Internet / WiFi' },
  { value: 'streaming',   label: 'Streaming y suscripciones' },
  { value: 'community',   label: 'Comunidad de propietarios' },
  { value: 'insurance',   label: 'Seguros' },
  { value: 'ibi',         label: 'IBI y tasas municipales' },
  { value: 'supplies',    label: 'Materiales y suministros' },
  { value: 'marketing',   label: 'Marketing y fotografía' },
  { value: 'management',  label: 'Comisiones de gestión' },
  { value: 'mortgage',    label: 'Hipoteca' },
  { value: 'other',       label: 'Otros' },
] as const

export type CategoryValue = (typeof EXPENSE_CATEGORIES)[number]['value']

export const CATEGORY_LABEL: Record<CategoryValue, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map(c => [c.value, c.label])
) as Record<CategoryValue, string>
