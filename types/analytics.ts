export interface DashboardKPIs {
  reservations_this_month: number
  reservations_this_month_trend: number | null

  occupancy_this_month: number
  occupancy_this_month_trend: number | null

  active_guests_now: number
  active_guests_trend: number | null

  net_income_this_month: number
  net_income_this_month_trend: number | null

  gross_income_this_month: number
}

export interface AnalyticsKPIs {
  total_reservations: number
  total_gross_income: number
  total_net_income: number
  total_real_income: number
  total_expenses: number
  net_margin_pct: number

  avg_daily_rate: number
  revpar: number
  occupancy_rate: number
  avg_stay_duration: number
  avg_lead_time: number | null

  vs_previous: {
    reservations: number | null
    gross_income: number | null
    occupancy: number | null
    net_margin: number | null
  }
}

export interface MonthlyDataPoint {
  month: string
  month_label: string
  gross_income: number
  net_income: number
  expenses: number
  real_margin: number
  occupancy_rate: number
  reservations_count: number
}

export interface ChannelDataPoint {
  channel_name: string
  channel_code: string
  reservations: number
  gross_income: number
  percentage: number
}

export interface ExpenseCategoryDataPoint {
  category: string
  category_label: string
  total: number
  percentage: number
}

export interface ProjectionDataPoint {
  month: string
  month_label: string
  projected_income: number
  projected_expenses: number
  projected_margin: number
  confirmed_reservations: number
  is_current_month: boolean
}

export interface RecentActivity {
  id: string
  type: 'new_reservation' | 'checkout' | 'expense' | 'guest_message'
  title: string
  subtitle: string
  time_ago: string
  href: string
}

export interface PropertyStatus {
  id: string
  name: string
  location: string
  image_url: string | null
  current_status: 'occupied' | 'upcoming' | 'available'
  next_checkout: string | null
  next_checkin: string | null
  current_guest: string | null
}
