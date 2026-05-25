import type { PropertyLanding } from '@/lib/types/property';
import type { Guests } from '@/lib/types/booking';
import type { PriceBreakdownItem } from '@/lib/types/pricing';
import { calculatePriceBreakdown, formatPrice } from '@/lib/landing/utils';

interface Props {
  landing: Pick<PropertyLanding, 'price_per_night' | 'cleaning_fee' | 'service_fee_pct' | 'tourist_tax_per_night' | 'pet_fee_flat'>;
  nights: number;
  guests: Guests;
  /**
   * When present, shows per-night dynamic breakdown instead of a single
   * "X€ × N nights" line. Provided by BookingWidget when pricePeriods exist.
   */
  dynamicBreakdown?: PriceBreakdownItem[];
  /** Pre-computed dynamic base total. Used when dynamicBreakdown is provided. */
  dynamicBaseTotal?: number;
}

/**
 * Presentational price breakdown.
 * Supports both static (price × nights) and dynamic (day-by-day) modes.
 */
export function PriceBreakdown({ landing, nights, guests, dynamicBreakdown, dynamicBaseTotal }: Props) {
  if (nights <= 0) return null;

  const { cleaningFee, serviceFee, touristTax, petFee, total, basePrice } =
    calculatePriceBreakdown(landing, nights, guests, dynamicBaseTotal);

  const isDynamic = dynamicBreakdown && dynamicBreakdown.length > 0;

  // Group consecutive nights with same price+label for compact display
  const grouped: { label: string; price: number; count: number }[] = [];
  if (isDynamic) {
    for (const item of dynamicBreakdown) {
      const last = grouped[grouped.length - 1];
      if (last && last.price === item.price && last.label === item.label) {
        last.count++;
      } else {
        grouped.push({ label: item.label, price: item.price, count: 1 });
      }
    }
  }

  return (
    <div className="lp-breakdown">
      {/* Base price rows */}
      {isDynamic ? (
        grouped.map((g, i) => (
          <div className="lp-bb-row" key={i}>
            <span>
              {g.label} · {formatPrice(g.price)} × {g.count} noche{g.count !== 1 ? 's' : ''}
            </span>
            <span>{formatPrice(g.price * g.count)}</span>
          </div>
        ))
      ) : (
        <div className="lp-bb-row">
          <span>{formatPrice(landing.price_per_night)} × {nights} noche{nights !== 1 ? 's' : ''}</span>
          <span>{formatPrice(basePrice)}</span>
        </div>
      )}

      {cleaningFee > 0 && (
        <div className="lp-bb-row">
          <span>Tarifa limpieza</span><span>{formatPrice(cleaningFee)}</span>
        </div>
      )}
      {serviceFee > 0 && (
        <div className="lp-bb-row">
          <span>Tarifa de servicio ({landing.service_fee_pct}%)</span>
          <span>{formatPrice(serviceFee)}</span>
        </div>
      )}
      {touristTax > 0 && (
        <div className="lp-bb-row">
          <span>Tasa turística</span><span>{formatPrice(touristTax)}</span>
        </div>
      )}
      {petFee > 0 && (
        <div className="lp-bb-row">
          <span>Suplemento mascotas</span><span>{formatPrice(petFee)}</span>
        </div>
      )}
      <div className="lp-bb-row lp-bb-total">
        <span>TOTAL</span><span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
