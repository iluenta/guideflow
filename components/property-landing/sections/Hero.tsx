interface Props {
  title: string;
  subtitle?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  maxGuests?: number;
  beds?: number;
}

/** Hero section: eyebrow, title, meta (rating, location, capacity). */
export function Hero({ title, subtitle, city, country, rating, reviewCount, maxGuests, beds }: Props) {
  return (
    <section className="lp-hero">
      <div className="lp-wrap">
        <div className="lp-hero-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            {subtitle && (
              <div className="lp-hero-eyebrow">{subtitle}</div>
            )}
            <h1 className="lp-title">{title}</h1>
            <div className="lp-hero-meta">
              {(rating ?? 0) > 0 && (
                <>
                  <span className="lp-rating">
                    <span className="lp-star">★</span>
                    {' '}{rating!.toFixed(2)}
                    {reviewCount ? <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}> ({reviewCount} reseñas)</span> : null}
                  </span>
                  <span style={{ color: 'var(--ink-mute)' }}>·</span>
                </>
              )}
              {city && <span>{city}{country ? `, ${country}` : ''}</span>}
              {(maxGuests || beds) && (
                <>
                  <span style={{ color: 'var(--ink-mute)' }}>·</span>
                  <span>
                    {maxGuests ? `Hasta ${maxGuests} huéspedes` : ''}
                    {beds ? ` · ${beds} dormitorios` : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => navigator.share?.({ title, url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--rule)', padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Compartir
            </button>
            <button
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--rule)', padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
