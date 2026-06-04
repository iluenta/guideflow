'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createPublicBooking } from '@/app/actions/landing-booking';
import type { Property, PropertyLanding } from '@/lib/types/property';
import type { Guests } from '@/lib/types/booking';
import {
  isBefore, sameDay, formatDate, formatGuestLabel,
  calculateNights, calculatePriceBreakdown, hasBlockedInRange, addDays,
} from '@/lib/landing/utils';
import { calculateDynamicBreakdown } from '@/lib/pricing/calculator';
import type { PricePeriod } from '@/lib/types/pricing';
import { Calendar } from './Calendar';
import { GuestCounter } from './GuestCounter';
import { PriceBreakdown } from './PriceBreakdown';
import { ReservationModal, type ModalFormData } from './ReservationModal';

interface Props {
  property: Property;
  landing: PropertyLanding;
  /** Dates occupied by confirmed reservations (shown grey, strikethrough). */
  blockedDates: string[];
  /**
   * Dates voluntarily closed by the host (obras, limpieza, vacaciones…).
   * Shown red in the calendar.
   */
  hostBlockedDates?: string[];
  /**
   * Optional tooltip labels for host-blocked dates.
   * Map of "YYYY-MM-DD" → reason label.
   */
  hostBlockedLabels?: Map<string, string>;
  /**
   * Dynamic price periods fetched from property_price_periods.
   * When present, BookingWidget uses day-by-day pricing instead of the flat
   * price_per_night from landing config.
   */
  pricePeriods?: PricePeriod[];
  /** Called after a successful booking confirmation. Receives the booking result. */
  onReservationSubmit?: (result: { success: boolean; reservationId?: string }) => void;
}

/**
 * Container: orchestrates the entire booking flow.
 * – Manages calendar, guest counter, and modal state.
 * – Validates blocked dates in the selected range.
 * – Calculates price breakdown via useMemo.
 * – Owns ReservationModal (shows/hides it internally).
 */
export function BookingWidget({ property, landing, blockedDates, hostBlockedDates, hostBlockedLabels, pricePeriods, onReservationSubmit }: Props) {
  // Merge reservations + host-blocked into a single unavailable set.
  // Guests don't need to know the reason — all unavailable days look the same.
  const blockedSet = useMemo(
    () => new Set([...blockedDates, ...(hostBlockedDates ?? [])]),
    [blockedDates, hostBlockedDates],
  );

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  // ── Guest state ─────────────────────────────────────────────────────────────
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [guests, setGuests] = useState<Guests>({ adults: 2, children: 0, infants: 0, pets: 0 });

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);

  // ── Min stay ────────────────────────────────────────────────────────────────
  const minStay = landing.policies?.minStay ?? 1;

  // Earliest selectable checkout when the user is picking the end date.
  // If minStay = 3, checkout must be at least checkIn + 3 days.
  const minCheckoutDate = useMemo(
    () => (checkIn && selectingEnd ? addDays(checkIn, minStay) : null),
    [checkIn, selectingEnd, minStay],
  );

  // ── Derived: price breakdown (memoized) ─────────────────────────────────────
  const nights = useMemo(
    () => (checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );

  // Dynamic nightly breakdown (only when pricePeriods provided AND dates selected)
  const dynamicResult = useMemo(() => {
    if (!pricePeriods || !checkIn || !checkOut || nights === 0) return null;
    return calculateDynamicBreakdown(
      checkIn,
      checkOut,
      pricePeriods,
      landing.price_per_night, // fallback for nights outside any period
    );
  }, [pricePeriods, checkIn, checkOut, nights, landing.price_per_night]);

  const breakdown = useMemo(
    () => calculatePriceBreakdown(
      landing,
      nights,
      guests,
      dynamicResult?.baseTotal,   // undefined → static mode
    ),
    [landing, nights, guests, dynamicResult],
  );

  // ── Calendar handlers ───────────────────────────────────────────────────────

  /**
   * Handles date selection logic:
   * - First click → set checkIn
   * - Second click (> checkIn) → validate range; if blocked dates found in between,
   *   reset and treat clicked date as new checkIn
   * - Second click (≤ checkIn) → restart from clicked date
   */
  const handleSelectDate = useCallback((date: Date) => {
    if (!checkIn || !selectingEnd) {
      setCheckIn(date);
      setCheckOut(null);
      setSelectingEnd(true);
      return;
    }

    // Restart if user clicks same or earlier date
    if (isBefore(date, checkIn) || sameDay(date, checkIn)) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    // Validate no blocked dates (reservations + host-blocked) in range [checkIn+1, date-1]
    if (hasBlockedInRange(checkIn, date, blockedSet)) {
      // Reset — treat the new date as a fresh checkIn
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    // Enforce minimum stay
    const selectedNights = calculateNights(checkIn, date);
    if (selectedNights < minStay) {
      // Don't close — user needs to pick a later date; calendar already disables earlier ones
      return;
    }

    // Valid range
    setCheckOut(date);
    setSelectingEnd(false);
    setCalOpen(false);
  }, [checkIn, selectingEnd, blockedSet, minStay]);

  const clearDates = useCallback(() => {
    setCheckIn(null);
    setCheckOut(null);
    setSelectingEnd(false);
  }, []);

  const prevMonth = useCallback(() => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    const max = new Date();
    max.setMonth(max.getMonth() + 11); // allow up to 12 months ahead
    const current = new Date(calYear, calMonth);
    if (current >= max) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }, [calMonth, calYear]);

  // ── Show/hide modal ─────────────────────────────────────────────────────────

  const showModal = useCallback(() => {
    if (checkIn && checkOut && nights >= minStay) setModalOpen(true);
  }, [checkIn, checkOut, nights, minStay]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  // ── Server action call ──────────────────────────────────────────────────────

  const handleBookingSubmit = useCallback(async (formData: ModalFormData) => {
    if (!checkIn || !checkOut) return { success: false, error: 'Fechas no seleccionadas' };

    let result: { success: boolean; reservationId?: string; error?: string };

    try {
      result = await createPublicBooking({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests,
        contact: {
          name: `${formData.contact.nombre} ${formData.contact.apellidos}`.trim(),
          email: formData.contact.email,
          phone: formData.contact.telefono,
          country: formData.contact.pais || undefined,
        },
        paymentMethod: (formData.paymentMethod as import('@/lib/types/booking').PaymentMethod) ?? 'card',
      });
    } catch {
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' };
    }

    if (result.success) {
      onReservationSubmit?.(result);
      return result;
    }

    // Dates became unavailable while the modal was open: close + reset
    const isDateConflict = result.error?.toLowerCase().includes('disponible') ||
      result.error?.toLowerCase().includes('fecha');

    if (isDateConflict) {
      toast.error('Las fechas ya no están disponibles. Elige otras fechas.', { duration: 5000 });
      setModalOpen(false);
      setCheckIn(null);
      setCheckOut(null);
      setSelectingEnd(false);
    }

    return result;
  }, [checkIn, checkOut, guests, property.id, onReservationSubmit]);

  // ── Second calendar month ───────────────────────────────────────────────────
  const month2 = calMonth === 11 ? 0 : calMonth + 1;
  const year2  = calMonth === 11 ? calYear + 1 : calYear;

  const galleryImages = landing.gallery?.length ? landing.gallery : property.main_image_url ? [property.main_image_url] : [];

  // ── Close popups on outside click ──────────────────────────────────────────
  const fieldsWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fieldsWrapRef.current && !fieldsWrapRef.current.contains(e.target as Node)) {
        setCalOpen(false);
        setGuestsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="lp-book-wrap">
        <div className="lp-book">
          {/* Brown header */}
          <div className="lp-book-header">
            <div className="lp-book-price">
              {pricePeriods && pricePeriods.length > 0 ? (
                <>
                  <span className="num" style={{ fontSize: '0.85em' }}>Precio dinámico</span>
                  <span className="unit">por temporada</span>
                </>
              ) : (
                <>
                  <span className="num">{landing.price_per_night}€</span>
                  <span className="unit">/ noche</span>
                </>
              )}
            </div>
          </div>

          <div className="lp-book-body">
          {/* ── Date + guest fields ── */}
          {/*
            WRAPPER has position:relative (popup anchor) but NO overflow:hidden.
            lp-book-fields keeps overflow:hidden for border-radius clipping.
            Popups are siblings of lp-book-fields so they're not clipped.
          */}
          <div ref={fieldsWrapRef} style={{ position: 'relative', marginBottom: 10 }}>
            <div className="lp-book-fields">
              {/* Entrada */}
              <div
                className="lp-bf"
                onClick={() => { setCalOpen(o => !o); setGuestsOpen(false); }}
                role="button"
                aria-label="Seleccionar fecha de entrada"
              >
                <span className="lp-bf-label">Entrada</span>
                <span className={`lp-bf-value${!checkIn ? ' lp-bf-placeholder' : ''}`}>
                  {checkIn ? formatDate(checkIn) : 'Añadir fecha'}
                </span>
              </div>

              {/* Salida */}
              <div
                className="lp-bf"
                onClick={() => { setCalOpen(o => !o); setGuestsOpen(false); }}
                role="button"
                aria-label="Seleccionar fecha de salida"
              >
                <span className="lp-bf-label">Salida</span>
                <span className={`lp-bf-value${!checkOut ? ' lp-bf-placeholder' : ''}`}>
                  {checkOut ? formatDate(checkOut) : 'Añadir fecha'}
                </span>
              </div>

              {/* Huéspedes */}
              <div
                className="lp-bf lp-bf-guests"
                onClick={() => { setGuestsOpen(o => !o); setCalOpen(false); }}
                role="button"
                aria-label="Seleccionar huéspedes"
              >
                <span className="lp-bf-label">Huéspedes</span>
                <span className="lp-bf-value">{formatGuestLabel(guests)}</span>
              </div>
            </div>

            {/* Calendar popup — sibling of lp-book-fields, not clipped by its overflow */}
            {calOpen && (
              <div className="lp-cal-popup">
                <div className="lp-cal-months">
                  <Calendar
                    month={calMonth} year={calYear}
                    checkIn={checkIn} checkOut={checkOut} hovered={hovered}
                    blocked={blockedSet}
                    minDate={minCheckoutDate ?? undefined}
                    onSelectDate={handleSelectDate}
                    onDayHover={setHovered}
                    onPrev={prevMonth}
                  />
                  <Calendar
                    month={month2} year={year2}
                    checkIn={checkIn} checkOut={checkOut} hovered={hovered}
                    blocked={blockedSet}
                    minDate={minCheckoutDate ?? undefined}
                    onSelectDate={handleSelectDate}
                    onDayHover={setHovered}
                    onNext={nextMonth}
                  />
                </div>
                <div className="lp-cal-foot">
                  <div className="lp-cal-legend">
                    <span><i className="lp-cal-dot avail" />Disponible</span>
                    <span><i className="lp-cal-dot blocked" />No disponible</span>
                    <span><i className="lp-cal-dot selected" />Tu reserva</span>
                    {minStay > 1 && (
                      <span style={{ color: 'var(--brand)', fontWeight: 600 }}>
                        Mín. {minStay} noche{minStay !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={clearDates}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'underline', textUnderlineOffset: 3 }}
                    >
                      Borrar fechas
                    </button>
                    <button
                      onClick={() => setCalOpen(false)}
                      style={{ background: 'var(--ink)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Guests popup */}
            {guestsOpen && (
              <GuestCounter
                guests={guests}
                petFeeEnabled={Number(landing.pet_fee_flat) > 0}
                onChange={setGuests}
                onClose={() => setGuestsOpen(false)}
              />
            )}
          </div>

          {/* Reserve button */}
          <button
            className="lp-btn-reserve"
            disabled={!checkIn || !checkOut || nights < minStay}
            onClick={showModal}
          >
            {!checkIn || !checkOut
              ? 'Selecciona fechas'
              : nights < minStay
                ? `Mínimo ${minStay} noches`
                : 'Reservar ahora'}
          </button>
          <p className="lp-book-note">Sin comisiones · Pago al anfitrión</p>

          {/* Price breakdown */}
          {nights > 0 && (
            <PriceBreakdown
              landing={landing}
              nights={nights}
              guests={guests}
              dynamicBreakdown={dynamicResult?.breakdown}
              dynamicBaseTotal={dynamicResult?.baseTotal}
            />
          )}
          </div>{/* lp-book-body */}
        </div>
      </div>

      {/* Reservation modal (owned by this container) */}
      {checkIn && checkOut && (
        <ReservationModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleBookingSubmit}
          checkIn={checkIn}
          checkOut={checkOut}
          total={breakdown.total}
          guests={guests}
          propertyName={property.name}
          coverImage={galleryImages[0]}
          pricePerNight={landing.price_per_night}
          nights={nights}
          dynamicBreakdown={dynamicResult?.breakdown}
        />
      )}
    </>
  );
}
