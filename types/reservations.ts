// Types for the reservations module

export type ProviderType =
  | 'cleaning'
  | 'laundry'
  | 'checkin'
  | 'maintenance'
  | 'utilities'
  | 'wifi'
  | 'streaming'
  | 'community'
  | 'insurance'
  | 'ibi'
  | 'supplies'
  | 'marketing'
  | 'management'
  | 'other'

export interface ProviderService {
  id: string
  provider_id: string
  category: ProviderType
  is_primary: boolean
  created_at: string
}

export interface Provider {
  id: string
  tenant_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined — siempre presente al leer proveedores
  provider_services: ProviderService[]
}

export interface CreateProviderInput {
  name: string
  categories: ProviderType[]
  primary_category: ProviderType | null
  phone?: string
  email?: string
  notes?: string
}

export interface UpdateProviderInput {
  name?: string
  categories?: ProviderType[]
  primary_category?: ProviderType | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  is_active?: boolean
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show'

export type ChargeType =
  | 'accommodation'
  | 'cleaning'
  | 'deposit'
  | 'tourist_tax'
  | 'late_checkout'
  | 'early_checkin'
  | 'extra_guest'
  | 'pet'
  | 'other'

export type CommissionType = 'sale' | 'payment'
export type PaymentType = 'deposit' | 'payment' | 'refund'
export type VatTreatment = 'none' | 'standard' | 'reverse_charge'
export type CollectionParty = 'platform' | 'host'
export type ChargeBeneficiary = 'owner' | 'provider'
export type ChargePaymentStatus = 'pending' | 'collected' | 'waived'

export interface ChannelSetting {
  id: string
  tenant_id: string
  name: string
  code: string
  is_active: boolean
  sale_commission_pct: number
  sale_commission_vat_pct: number
  vat_treatment: VatTreatment
  collection_party: CollectionParty
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PaymentMethodSetting {
  id: string
  tenant_id: string
  name: string
  code: string
  is_active: boolean
  payment_commission_pct: number
  payment_commission_vat_pct: number
  sort_order: number
  payment_account_id: string | null
  created_at: string
  updated_at: string
}

export interface ChargeTemplate {
  id: string
  tenant_id: string
  property_id: string
  name: string
  code: string
  charge_type: ChargeType
  default_amount: number | null
  is_refundable: boolean
  vat_pct: number
  is_active: boolean
  sort_order: number
  included_in_gross: boolean  // true = desglose del bruto canal, false = extra fuera del canal
  default_provider_id: string | null
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  tenant_id: string
  property_id: string
  channel_id: string | null
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  guest_country: string | null
  guests_count: number
  checkin_date: string
  checkout_date: string
  gross_amount: number
  currency: string
  total_sale_commission: number
  total_sale_commission_vat: number
  total_pay_commission: number
  total_pay_commission_vat: number
  status: ReservationStatus
  external_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ReservationCharge {
  id: string
  tenant_id: string
  reservation_id: string
  template_id: string | null
  name: string
  charge_type: ChargeType
  amount: number
  vat_pct: number
  vat_amount: number
  is_refundable: boolean
  sort_order: number
  // Nuevos campos (migración 053)
  included_in_gross: boolean        // true = desglose del bruto, false = extra fuera del canal
  beneficiary: ChargeBeneficiary    // 'owner' | 'provider'
  provider_id: string | null        // proveedor de la biblioteca
  provider_name_override: string | null  // proveedor ad-hoc (texto libre)
  charge_payment_status: ChargePaymentStatus  // aplica a todos los extras (included_in_gross=false)
  charge_payment_method_id: string | null
  charge_payment_date: string | null
  charge_payment_reference: string | null
  created_at: string
  provider?: Provider | null
}

export interface ReservationCommission {
  id: string
  tenant_id: string
  reservation_id: string
  commission_type: CommissionType
  base_amount: number
  pct_applied: number
  amount: number
  vat_pct: number
  vat_amount: number
  vat_treatment: VatTreatment
  channel_id: string | null
  payment_method_id: string | null
  description: string | null
  created_at: string
}

export interface ReservationPayment {
  id: string
  tenant_id: string
  reservation_id: string
  payment_method_id: string | null
  payment_account_id: string | null
  amount: number
  payment_date: string
  payment_type: PaymentType
  reference: string | null
  notes: string | null
  created_at: string
  payment_method?: PaymentMethodSetting
}

// Campos calculados (no almacenados, excepto totales desnormalizados)
export interface ReservationCalculated {
  nights: number
  // Cargos incluidos en el bruto del canal
  total_charges: number           // suma de included_in_gross=true
  // Cobros del canal
  total_received: number          // SUM(payments WHERE type != 'refund')
  pending_amount: number          // gross_amount - total_received
  // Financiero
  net_amount: number              // gross_amount - commission_total
  commission_total: number
  commission_pct_effective: number
  // Extras fuera del canal
  total_extras_owner: number            // extras con beneficiary='owner'
  total_extras_owner_collected: number  // extras cobrados
  total_extras_owner_pending: number    // extras pendientes
  total_extras_provider: number         // extras informativos (proveedor)
  // Ingreso total del anfitrión
  total_income: number            // net_amount + total_extras_owner
  // Estado de cierre
  is_locked: boolean
  // canal cobrado Y todos extras owner = collected|waived
}

export interface ReservationWithDetails extends Reservation, ReservationCalculated {
  channel: ChannelSetting | null
  property: { id: string; name: string; full_address: string | null }
  charges: ReservationCharge[]
  commissions: ReservationCommission[]
  payments: ReservationPayment[]
}

// Overrides de comisiones que el usuario puede editar manualmente en el wizard
export interface CommissionOverrides {
  sale_pct: number
  sale_amount: number
  sale_vat_pct: number
  sale_vat_amount: number
  pay_pct: number
  pay_amount: number
  pay_vat_pct: number
  pay_vat_amount: number
}

// Resultado del cálculo de comisiones
export interface CommissionResult {
  salePct: number
  saleAmount: number
  saleVatPct: number
  saleVatAmount: number
  payPct: number
  payAmount: number
  payVatPct: number
  payVatAmount: number
  totalCommissions: number
  netAmount: number
}

// Input para un cargo en el formulario
export interface CreateReservationChargeInput {
  template_id?: string
  name: string
  charge_type: ChargeType
  amount: number
  vat_pct: number
  is_refundable: boolean
  sort_order: number
  included_in_gross: boolean
  beneficiary: ChargeBeneficiary
  provider_id?: string
  provider_name_override?: string
  charge_payment_status?: ChargePaymentStatus
  charge_payment_method_id?: string
  charge_payment_date?: string
  charge_payment_reference?: string
}

export interface CreateReservationPaymentInput {
  payment_method_id: string
  amount: number
  payment_date: string
  payment_type: 'deposit' | 'payment'
  reference?: string
  notes?: string
}

export interface CreateReservationInput {
  property_id: string
  channel_id: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  guest_country?: string
  guests_count: number
  checkin_date: string
  checkout_date: string
  gross_amount: number
  currency?: string
  external_id?: string
  notes?: string
  charges: CreateReservationChargeInput[]
  commissions: CommissionOverrides
  initial_payment?: CreateReservationPaymentInput
}

export interface UpdateReservationInput {
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  guest_country?: string
  guests_count?: number
  checkin_date?: string
  checkout_date?: string
  gross_amount?: number
  channel_id?: string
  external_id?: string
  notes?: string
  property_id?: string
  currency?: string
  charges?: CreateReservationChargeInput[]
  commissions?: CommissionOverrides
  confirmed?: boolean
}

// Input para actualizar el estado de cobro de un cargo extra
export interface UpdateChargePaymentInput {
  charge_payment_status: ChargePaymentStatus
  charge_payment_method_id?: string
  charge_payment_date?: string
  charge_payment_reference?: string
}

// Preview de impacto al cambiar gross_amount con pagos existentes
export interface GrossChangePreview {
  gross_before: number
  gross_after: number
  commissions_before: number
  commissions_after: number
  net_before: number
  net_after: number
  total_received: number
  pending_before: number
  pending_after: number
  is_overpaid: boolean
  overpaid_amount: number
}

export interface AddPaymentInput {
  payment_method_id: string
  payment_account_id?: string | null
  amount: number
  payment_date: string
  payment_type: PaymentType
  reference?: string
  notes?: string
}

export interface ReservationFilters {
  property_id?: string
  channel_id?: string
  status?: ReservationStatus[]
  date_from?: string
  date_to?: string
  has_pending?: boolean
  search?: string
  page?: number
  per_page?: number
}

export interface ReservationsSummary {
  total_reservations: number
  gross_total: number
  net_total: number
  pending_total: number
  occupancy_pct: number
}

export interface ReservationListItem extends Reservation, ReservationCalculated {
  channel: ChannelSetting | null
  property: { id: string; name: string }
}

// Settings inputs
export interface CreateChannelInput {
  name: string
  code: string
  sale_commission_pct: number
  sale_commission_vat_pct: number
  vat_treatment: VatTreatment
  collection_party: CollectionParty
  sort_order?: number
}

export interface UpdateChannelInput extends Partial<CreateChannelInput> {
  is_active?: boolean
}

export interface CreatePaymentMethodInput {
  name: string
  code: string
  payment_commission_pct: number
  payment_commission_vat_pct: number
  sort_order?: number
}

export interface UpdatePaymentMethodInput extends Partial<CreatePaymentMethodInput> {
  is_active?: boolean
}

export interface CreateChargeTemplateInput {
  property_id: string
  name: string
  code: string
  charge_type: ChargeType
  default_amount?: number
  is_refundable?: boolean
  vat_pct?: number
  sort_order?: number
  included_in_gross?: boolean
}

export interface UpdateChargeTemplateInput extends Partial<Omit<CreateChargeTemplateInput, 'property_id'>> {
  is_active?: boolean
}
