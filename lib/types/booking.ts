export interface Guests {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface PriceBreakdown {
  nights: number;
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  touristTax: number;
  petFee: number;
  total: number;
}

export interface BookingContact {
  name: string;
  email: string;
  phone: string;
  country?: string;
}

export type PaymentMethod = 'card' | 'bizum' | 'apple' | 'google';
