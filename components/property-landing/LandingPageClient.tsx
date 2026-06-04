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
        showLocation={landing.show_location && !!property.latitude}
        showReviews={landing.show_reviews}
        hasAmenities={!!(landing.landing_amenities?.length || amenities.length)}
        hasReviews={(landing.reviews_count ?? 0) > 0}
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
        baths={property.baths}
        sizeSqm={landing.size_sqm}
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
            platformRatings={landing.platform_ratings ?? []}
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
          {/* 3-column body */}
          <div className="lp-footer-body">
            {/* Col 1: Property info */}
            <div>
              <div className="lp-footer-brand">{property.name}</div>
              {landing.hero_subtitle && (
                <p className="lp-footer-tagline">{landing.hero_subtitle}</p>
              )}
              {landing.tourist_registration && (
                <p className="lp-footer-reg">Registro Turístico · {landing.tourist_registration}</p>
              )}
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p className="lp-footer-col-title">La casa</p>
              <ul className="lp-footer-nav">
                <li><a href="#about">Sobre el alojamiento</a></li>
                {(landing.landing_amenities?.length || property.amenities?.length) ? (
                  <li><a href="#about">Servicios</a></li>
                ) : null}
                {landing.show_location && property.latitude && (
                  <li><a href="#location">Ubicación</a></li>
                )}
                {landing.show_reviews && (landing.reviews_count ?? 0) > 0 && (
                  <li><a href="#reviews">Reseñas</a></li>
                )}
                {(landing.faqs?.length ?? 0) > 0 && (
                  <li><a href="#faq">Preguntas frecuentes</a></li>
                )}
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div>
              <p className="lp-footer-col-title">Contacto</p>
              <div className="lp-footer-contact-list">
                <a href={`mailto:${landing.contact_email}`}>{landing.contact_email}</a>
                {landing.contact_phone && (
                  <a href={`tel:${landing.contact_phone.replace(/[\s\-().]/g, '')}`}>
                    {landing.contact_phone}
                  </a>
                )}
                {landing.contact_phone && (
                  <a
                    href={`https://wa.me/${landing.contact_phone.replace(/[\s\-().+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-footer-wa"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: '#25d366' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} {property.name.toUpperCase()}{property.city ? ` · ${property.city.toUpperCase()}` : ''}</span>
            <span className="lp-footer-powered">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Powered by <strong>Hospyia</strong>
            </span>
          </div>

          {/* Watermark */}
          <div aria-hidden="true" style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: 'clamp(48px, 10vw, 120px)',
            fontWeight: 700,
            letterSpacing: '-.03em',
            color: 'rgba(255,255,255,.06)',
            textAlign: 'center',
            lineHeight: 1,
            marginTop: 24,
            userSelect: 'none',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}>
            {property.name.toUpperCase()}
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
