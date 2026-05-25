'use client';

import type { Property, PropertyLanding } from '@/lib/types/property';
import type { PricePeriod } from '@/lib/types/pricing';
import { useState, useEffect, useCallback } from 'react';
import { ThemeWrapper } from './ThemeWrapper';
import { Topbar } from './sections/Topbar';
import { Hero } from './sections/Hero';
import { Gallery } from './sections/Gallery';
import { PropertyDetails } from './sections/PropertyDetails';
import { Amenities } from './sections/Amenities';
import { Location } from './sections/Location';
import { Reviews } from './sections/Reviews';
import { Host } from './sections/Host';
import { HouseRules } from './sections/HouseRules';
import { Contact } from './sections/Contact';
import { FAQs } from './sections/FAQs';
import { BookingWidget } from './booking/BookingWidget';

interface Props {
  property: Property;
  landing: PropertyLanding;
  initialBlockedDates: string[];
  hostBlockedDates?: string[];
  hostBlockedLabels?: Record<string, string>;
  pricePeriods?: PricePeriod[];
}

export function LandingPageClient({ property, landing, initialBlockedDates, hostBlockedDates, hostBlockedLabels, pricePeriods }: Props) {
  // Convert hostBlockedLabels plain object → Map (once, on mount)
  const hostBlockedLabelsMap = hostBlockedLabels
    ? new Map(Object.entries(hostBlockedLabels))
    : undefined;
  const galleryImages = landing.gallery?.length
    ? landing.gallery
    : property.main_image_url ? [property.main_image_url] : [];

  const amenities = (landing.landing_amenities?.length ? landing.landing_amenities : property.amenities) ?? [];

  // Mobile sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = useCallback(() => {
    setSheetOpen(true);
    document.body.classList.add('lp-sheet-open');
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    document.body.classList.remove('lp-sheet-open');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => document.body.classList.remove('lp-sheet-open');
  }, []);

  return (
    <ThemeWrapper palette={landing.palette} typography={landing.typography} borderRadius={landing.border_radius}>
      <Topbar
        title={property.name}
        hasFaqs={(landing.faqs?.length ?? 0) > 0}
      />

      {/* ── Hero ── */}
      <Hero
        title={property.name}
        subtitle={landing.hero_subtitle}
        city={property.city}
        rating={landing.reviews_rating}
        reviewCount={landing.reviews_count}
        maxGuests={property.guests}
        beds={property.beds}
      />

      {/* ── Gallery (full width) ── */}
      <div className="lp-wrap">
        <Gallery images={galleryImages} propertyName={property.name} />
      </div>

      {/* ── 2-column layout: content left · widget sticky right (desktop only) ── */}
      <div className="lp-main lp-wrap">
        {/* Left column: all content sections */}
        <div>
          <PropertyDetails
            title={landing.hero_title || property.name}
            beds={property.beds}
            baths={property.baths}
            maxGuests={property.guests}
            floor={property.floor ?? undefined}
            sizeSqm={landing.size_sqm}
            description={landing.custom_description || property.description}
          />

          <Amenities amenities={amenities} />

          <Location
            show={landing.show_location}
            latitude={property.latitude}
            longitude={property.longitude}
            city={property.city}
            fullAddress={property.full_address}
          />

          <Reviews
            show={landing.show_reviews}
            rating={landing.reviews_rating ?? 0}
            count={landing.reviews_count ?? 0}
            reviews={landing.reviews_list ?? []}
          />

          <Host
            name={landing.host_name}
            bio={landing.host_bio}
            email={landing.contact_email}
            phone={landing.contact_phone}
          />

          <HouseRules policies={landing.policies} petFee={Number(landing.pet_fee_flat)} />

          <Contact email={landing.contact_email} phone={landing.contact_phone} />

          {(landing.faqs?.length ?? 0) > 0 && <FAQs faqs={landing.faqs} />}
        </div>

        {/* Right column: sticky widget (desktop only, hidden on mobile via CSS) */}
        <div className="lp-widget-sidebar">
          <BookingWidget
            property={property}
            landing={landing}
            blockedDates={initialBlockedDates}
            hostBlockedDates={hostBlockedDates}
            hostBlockedLabels={hostBlockedLabelsMap}
            pricePeriods={pricePeriods}
            onReservationSubmit={(result) => {
              console.log('[LandingPageClient] Booking result:', result);
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-inner">
            <div>
              <div className="lp-footer-brand">{property.name}</div>
              <div style={{ marginTop: 4, fontSize: 12 }}>Reserva directa · Sin intermediarios</div>
            </div>
            <div className="lp-footer-contact">
              <a href={`mailto:${landing.contact_email}`}>{landing.contact_email}</a>
              {landing.contact_phone && <div style={{ marginTop: 4 }}>{landing.contact_phone}</div>}
            </div>
            <div style={{ fontSize: 11, opacity: .5 }}>Powered by Hospyia</div>
          </div>
        </div>
      </footer>

      {/* ── MOBILE: sticky bottom bar (siempre visible) ── */}
      <div className="lp-bottom-bar">
        <div className="lp-bb-info">
          <div>
            <span className="lp-bb-price">{landing.price_per_night}€</span>
            <span className="lp-bb-unit"> / noche</span>
          </div>
        </div>
        <button className="lp-bb-btn" onClick={openSheet}>
          Comprobar disponibilidad
        </button>
      </div>

      {/* ── MOBILE: slide-up booking sheet ── */}
      <div className={`lp-mobile-sheet${sheetOpen ? ' open' : ''}`}>
        <div className="lp-mobile-sheet-head">
          <span className="lp-mobile-sheet-title">Reserva tu estancia</span>
          <button className="lp-mobile-sheet-close" onClick={closeSheet} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="lp-mobile-sheet-body">
          <BookingWidget
            property={property}
            landing={landing}
            blockedDates={initialBlockedDates}
            hostBlockedDates={hostBlockedDates}
            hostBlockedLabels={hostBlockedLabelsMap}
            pricePeriods={pricePeriods}
            onReservationSubmit={(result) => {
              if (result.success) closeSheet();
              console.log('[LandingPageClient] Mobile booking result:', result);
            }}
          />
        </div>
      </div>
    </ThemeWrapper>
  );
}
