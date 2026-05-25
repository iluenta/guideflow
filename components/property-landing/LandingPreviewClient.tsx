'use client';

import type { PropertyLanding } from '@/lib/types/property';
import { formatPrice, calculatePriceBreakdown } from '@/lib/landing/utils';

type Config = Omit<PropertyLanding, 'property_id' | 'tenant_id'>;

interface Props {
  config: Config;
}

// Fixed Luxury palette — matches landing.css
const brand   = '#8B6F47';
const accent  = '#E8956F';
const bg      = '#FFF8F3';
const bgDeep  = '#F5E8D8';
const rule    = '#E8D5C0';
const ink     = '#1a2540';
const inkSoft = '#5C4A36';
const inkMute = '#9A8878';

export function LandingPreviewClient({ config }: Props) {
  const br   = '14px';
  const brSm = '8px';
  const h: React.CSSProperties = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700 };

  const breakdown = config.show_pricing
    ? calculatePriceBreakdown(config, 2, { adults: 2, children: 0, infants: 0, pets: 0 })
    : null;

  const coverImage = config.gallery?.[0];
  const amenities  = config.landing_amenities ?? [];
  const reviews    = config.reviews_list ?? [];

  return (
    <div style={{ background: bg, color: ink, fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 13, lineHeight: 1.5 }}>

      {/* Topbar */}
      <div style={{ background: 'white', borderBottom: `1px solid ${rule}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: brand, fontSize: 15, ...h }}>{config.hero_title || 'Tu propiedad'}</span>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: inkSoft }}>
          <span>La casa</span><span>Ubicación</span>{(config.faqs?.length ?? 0) > 0 && <span>FAQ</span>}
        </div>
      </div>

      {/* Hero + gallery */}
      <div style={{ position: 'relative', height: 160, background: coverImage ? 'none' : `linear-gradient(135deg, ${brand}33, ${brand}99)`, overflow: 'hidden' }}>
        {coverImage && (
          <img src={coverImage} alt="" style={{ width: coverImage && config.gallery.length > 1 ? '65%' : '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        {config.gallery && config.gallery.length > 1 && (
          <div style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
            {[1, 2].map(i => config.gallery[i] ? (
              <img key={i} src={config.gallery[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div key={i} style={{ background: `${brand}22` }} />
            ))}
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.55) 40%, transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 14 }}>
          {config.hero_subtitle && (
            <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
              {config.hero_subtitle}
            </div>
          )}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.15, ...h }}>
            {config.hero_title || 'Tu propiedad'}
          </div>
          {(config.reviews_rating ?? 0) > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', marginTop: 4 }}>
              ★ {(config.reviews_rating ?? 0).toFixed(2)} · {config.reviews_count ?? 0} reseñas
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 0 }}>
        {/* Left */}
        <div style={{ padding: '14px', borderRight: `1px solid ${rule}` }}>

          {/* Description */}
          {config.custom_description && (
            <div style={{ paddingBottom: 14, borderBottom: `1px solid ${rule}`, marginBottom: 14 }}>
              <h2 style={{ fontSize: 13, color: brand, marginBottom: 6, margin: '0 0 6px', ...h }}>Sobre el alojamiento</h2>
              <p style={{ color: inkSoft, fontSize: 12, lineHeight: 1.65, margin: 0 }}>
                {config.custom_description.slice(0, 140)}{config.custom_description.length > 140 ? '…' : ''}
              </p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div style={{ paddingBottom: 14, borderBottom: `1px solid ${rule}`, marginBottom: 14 }}>
              <h2 style={{ fontSize: 13, color: brand, margin: '0 0 8px', ...h }}>Lo que ofrece</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {amenities.slice(0, 6).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: inkSoft }}>
                    <span style={{ color: brand, fontSize: 13 }}>✓</span>{a}
                  </div>
                ))}
              </div>
              {amenities.length > 6 && (
                <div style={{ fontSize: 11, color: brand, marginTop: 6 }}>+ {amenities.length - 6} más</div>
              )}
            </div>
          )}

          {/* Reviews */}
          {config.show_reviews && (config.reviews_rating ?? 0) > 0 && (
            <div style={{ paddingBottom: 14, borderBottom: `1px solid ${rule}`, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <h2 style={{ fontSize: 13, color: brand, margin: 0, ...h }}>Reseñas</h2>
                <span style={{ color: accent, fontSize: 13 }}>★ {(config.reviews_rating ?? 0).toFixed(2)}</span>
                <span style={{ color: inkMute, fontSize: 11 }}>({config.reviews_count ?? 0})</span>
              </div>
              {reviews.slice(0, 2).map((r, i) => (
                <div key={i} style={{ background: 'white', border: `1px solid ${rule}`, borderRadius: brSm, padding: '8px 10px', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, color: ink, marginBottom: 2 }}>{r.author || 'Huésped'}{r.country ? ` · ${r.country}` : ''}</div>
                  <div style={{ fontSize: 11, color: inkSoft, lineHeight: 1.4 }}>{r.text?.slice(0, 80) || ''}…</div>
                </div>
              ))}
            </div>
          )}

          {/* Host */}
          {config.host_name && (
            <div style={{ paddingBottom: 14, borderBottom: `1px solid ${rule}`, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: brand, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {config.host_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: ink }}>{config.host_name}</div>
                {config.host_bio && <div style={{ fontSize: 11, color: inkSoft, marginTop: 2 }}>{config.host_bio.slice(0, 80)}…</div>}
              </div>
            </div>
          )}

          {/* Policies */}
          <div style={{ paddingBottom: 14, borderBottom: `1px solid ${rule}`, marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, color: brand, margin: '0 0 8px', ...h }}>Normas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Entrada', val: config.policies.checkIn },
                { label: 'Salida', val: config.policies.checkOut },
                ...(config.policies.minStay > 1 ? [{ label: 'Mínimo', val: `${config.policies.minStay} noches` }] : []),
                ...(config.pet_fee_flat > 0 ? [{ label: 'Mascotas', val: `+${formatPrice(config.pet_fee_flat)}` }] : []),
              ].map(({ label, val }) => (
                <div key={label} style={{ background: 'white', border: `1px solid ${rule}`, borderRadius: brSm, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: inkMute, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ink }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          {(config.faqs?.length ?? 0) > 0 && (
            <div>
              <h2 style={{ fontSize: 13, color: brand, margin: '0 0 8px', ...h }}>Preguntas frecuentes</h2>
              {config.faqs.slice(0, 2).map((faq, i) => (
                <div key={i} style={{ borderTop: `1px solid ${rule}`, padding: '8px 0', fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: brand, marginBottom: 2 }}>{faq.question || 'Pregunta…'}</div>
                  <div style={{ color: inkSoft }}>{faq.answer?.slice(0, 70) || 'Respuesta…'}{(faq.answer?.length ?? 0) > 70 ? '…' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: booking widget */}
        <div style={{ padding: 10 }}>
          <div style={{ background: 'white', border: `2px solid ${brand}`, borderRadius: br, padding: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: ink, marginBottom: 2 }}>
              {formatPrice(config.price_per_night)}<span style={{ fontSize: 11, fontWeight: 400, color: inkSoft }}>/noche</span>
            </div>

            <div style={{ border: `1px solid ${rule}`, borderRadius: brSm, overflow: 'hidden', marginBottom: 6 }}>
              {['Entrada', 'Salida'].map((lbl, i) => (
                <div key={lbl} style={{ padding: '5px 8px', borderBottom: i === 0 ? `1px solid ${rule}` : undefined, background: bgDeep }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: inkMute, marginBottom: 1 }}>{lbl}</div>
                  <div style={{ fontSize: 11, color: inkMute }}>Añadir</div>
                </div>
              ))}
              <div style={{ padding: '5px 8px', background: bgDeep }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: inkMute, marginBottom: 1 }}>Huéspedes</div>
                <div style={{ fontSize: 11, color: ink }}>2 huéspedes</div>
              </div>
            </div>

            <div style={{ background: brand, color: 'white', borderRadius: brSm, padding: '7px', textAlign: 'center', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Reservar ahora
            </div>

            {breakdown && config.show_pricing && (
              <div style={{ paddingTop: 6, borderTop: `1px solid ${rule}`, display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: inkSoft }}>
                  <span>{formatPrice(config.price_per_night)} × 2n</span><span>{formatPrice(breakdown.basePrice)}</span>
                </div>
                {breakdown.cleaningFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: inkSoft }}>
                    <span>Limpieza</span><span>{formatPrice(breakdown.cleaningFee)}</span>
                  </div>
                )}
                {breakdown.serviceFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: inkSoft }}>
                    <span>Gestión</span><span>{formatPrice(breakdown.serviceFee)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: ink, paddingTop: 4, borderTop: `1px solid ${rule}` }}>
                  <span>Total (2n)</span><span>{formatPrice(breakdown.total)}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ background: ink, color: 'rgba(255,255,255,.6)', padding: '14px', fontSize: 11 }}>
        <div style={{ fontWeight: 700, color: 'white', marginBottom: 4 }}>{config.hero_title || 'Tu propiedad'}</div>
        <div>{config.contact_email || 'email@ejemplo.com'}</div>
        {config.contact_phone && <div style={{ marginTop: 2 }}>{config.contact_phone}</div>}
      </div>
    </div>
  );
}
