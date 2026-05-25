import { Fragment } from 'react';

interface Review {
  author: string;
  country?: string;
  date: string;
  text: string;
}

interface Props {
  rating: number;
  count: number;
  reviews: Review[];
  show: boolean;
}

const RATING_LABELS = ['Limpieza', 'Comunicación', 'Ubicación', 'Precio-calidad'];

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: 'var(--accent)', letterSpacing: 1 }}>
      {'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Reviews section: overall rating, rating bars, and review cards. */
export function Reviews({ rating, count, reviews, show }: Props) {
  if (!show || (rating === 0 && reviews.length === 0)) return null;

  return (
    <div className="lp-section" id="reviews">
      <h2 className="lp-section-title">Lo que dicen los huéspedes</h2>

      {/* Summary */}
      {rating > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 28, padding: 24, background: 'var(--bg-deep)', borderRadius: 'var(--r-lg)' }}>
          <div>
            <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--brand)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {rating.toFixed(2)}
            </div>
            <Stars n={rating} />
            {count > 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
                {count} reseñas verificadas
              </div>
            )}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '5px 12px', alignItems: 'center', fontSize: 12 }}>
            {RATING_LABELS.map(label => (
              <Fragment key={label}>
                <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
                <div style={{ height: 4, background: 'var(--rule)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(rating / 5) * 100}%`, background: 'var(--brand)', borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink)' }}>{rating.toFixed(1)}</span>
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Review cards */}
      {reviews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ padding: 24, border: '1px solid var(--rule)', borderRadius: 'var(--r-lg)', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-soft)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  <Initials name={r.author} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.author}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'monospace' }}>
                    {r.country ? `${r.country} · ` : ''}{r.date}
                  </div>
                </div>
              </div>
              <div style={{ color: 'var(--accent)', fontSize: 12, marginBottom: 8 }}>★★★★★</div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
