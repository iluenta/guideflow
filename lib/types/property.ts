export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  location?: string;
  beds?: number;
  baths?: number;
  /** DB column: guests (not max_guests) */
  guests?: number;
  floor?: string | null;
  description?: string;
  amenities?: string[];
  images?: string[];
  contact_phone?: string;
  city?: string;
  full_address?: string;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  has_parking?: boolean;
  parking_number?: string;
  host_name?: string;
}

export interface PropertyLanding {
  property_id: string;
  tenant_id: string;
  enabled: boolean;
  
  hero_title?: string;
  hero_subtitle?: string;
  custom_description?: string;
  contact_email: string;
  contact_phone?: string;
  
  price_per_night: number;
  cleaning_fee: number;
  service_fee_pct: number;
  tourist_tax_per_night: number;
  pet_fee_flat: number;
  
  palette: 'coastal' | 'warm' | 'warmsand' | 'forest' | 'ink' | 'navy' | 'modern' | 'urban' | 'luxury';
  typography: 'modern' | 'editorial';
  border_radius: 'soft' | 'sharp';
  
  show_calendar: boolean;
  show_pricing: boolean;
  show_location: boolean;
  show_reviews: boolean;
  
  policies: {
    minStay: number;
    /** Custom house rules shown as cards in the landing */
    extraRules?: { title: string; note: string }[];
    /** Legacy fields kept for backwards compatibility with existing DB data */
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
  };
  
  faqs: { question: string; answer: string }[];
  gallery: string[];

  // Host info (migration 071)
  host_name?: string;
  host_bio?: string;

  // Landing-specific amenities — separate from property.amenities (migration 071)
  landing_amenities?: string[];

  // Reviews (migration 071)
  reviews_rating?: number;
  reviews_count?: number;
  reviews_list?: { author: string; country?: string; date: string; text: string }[];
  // Per-platform ratings (Booking, Airbnb, Google…)
  platform_ratings?: { platform: string; rating: number; count: number }[];

  // Property size in m² (migration 072)
  size_sqm?: number;

  // Tourist registration number shown in footer
  tourist_registration?: string;

  created_at?: string;
  updated_at?: string;
}

export interface ReservationRequest {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    country?: string;
  };
  paymentMethod: 'card' | 'bizum' | 'apple' | 'google';
}

export interface Reservation {
  id: string;
  tenant_id: string;
  property_id: string;
  channel_id: string;  // "DIRECT" para landings
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_country?: string;
  guests_count: number;
  checkin_date: Date;
  checkout_date: Date;
  gross_amount: number;  // Total a pagar
  currency: 'EUR';
  total_sale_commission: number;
  total_sale_commission_vat: number;
  total_pay_commission: number;
  total_pay_commission_vat: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  external_id?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: string;
  name: string;
  package_level: 'free' | 'pro' | 'enterprise';  // Tu modelo actual
  created_at: string;
}
