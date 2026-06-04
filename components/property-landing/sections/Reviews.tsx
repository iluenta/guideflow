import { Fragment } from 'react';

interface PlatformRating { platform: string; rating: number; count: number; }

interface Review {
  author: string;
  country?: string;
  date: string;
  text: string;
}

interface Props {
  show: boolean;
  rating?: number;
  count?: number;
  reviews?: Review[];
  platformRatings?: PlatformRating[];
}

// ── Platform icon detection ──────────────────────────────────────────────────

type PlatformConfig = { bg: string; color: string; icon: React.ReactNode };

function PlatformIcon({ platform }: { platform: string }) {
  const key = platform.toLowerCase().replace(/[\s.]/g, '');
  const cfg = PLATFORM_ICONS[key] ?? fallbackConfig(platform);
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: cfg.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {cfg.icon}
    </div>
  );
}

function fallbackConfig(name: string): PlatformConfig {
  const letter = name.trim()[0]?.toUpperCase() ?? '?';
  const hue = (letter.charCodeAt(0) * 37) % 360;
  return {
    bg: `hsl(${hue},55%,92%)`,
    color: `hsl(${hue},50%,35%)`,
    icon: <span style={{ fontWeight: 700, fontSize: 16, color: `hsl(${hue},50%,35%)` }}>{letter}</span>,
  };
}

const PLATFORM_ICONS: Record<string, PlatformConfig> = {
  bookingcom: {
    bg: '#003580', color: 'white',
    icon: (
      <svg width="22" height="22" viewBox="0 0 52 52" fill="none" aria-label="Booking.com">
        <rect width="52" height="52" rx="8" fill="#003580"/>
        <text x="10" y="37" fontFamily="Arial" fontWeight="900" fontSize="30" fill="white">B.</text>
      </svg>
    ),
  },
  booking: {
    bg: '#003580', color: 'white',
    icon: (
      <svg width="22" height="22" viewBox="0 0 52 52" fill="none" aria-label="Booking.com">
        <rect width="52" height="52" rx="8" fill="#003580"/>
        <text x="10" y="37" fontFamily="Arial" fontWeight="900" fontSize="30" fill="white">B.</text>
      </svg>
    ),
  },
  airbnb: {
    bg: '#FF5A5F', color: 'white',
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="white" aria-label="Airbnb">
        <path d="M16 1c-2.2 5.1-8 8.5-8 13.1C8 17.8 10.7 20 14 20c.9 0 1.7-.2 2.5-.5-.3.8-.5 1.7-.5 2.5C16 25.3 18.2 27 21 27c2.8 0 5-1.7 5-4.5C26 17 20.2 13.5 16 1zm-4.5 14.5c0-2.5 2.2-4.5 4.5-4.5s4.5 2 4.5 4.5S18.3 20 16 20s-4.5-2-4.5-4.5z"/>
      </svg>
    ),
  },
  google: {
    bg: 'white', color: '#4285F4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-label="Google">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  googlemaps: {
    bg: 'white', color: '#4285F4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-label="Google Maps">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  tripadvisor: {
    bg: '#00af87', color: 'white',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-label="TripAdvisor">
        <circle cx="7" cy="12" r="3.5"/>
        <circle cx="17" cy="12" r="3.5"/>
        <path d="M12 5C9.1 5 6.5 6.1 4.6 8H3l-1.5 2 2.1.2C3.2 10.8 3 11.4 3 12c0 2.2 1.8 4 4 4 1.3 0 2.5-.6 3.2-1.6L12 16l1.8-1.6c.7 1 1.9 1.6 3.2 1.6 2.2 0 4-1.8 4-4 0-.6-.1-1.2-.4-1.8l2.1-.2L21 8h-1.6C17.5 6.1 14.9 5 12 5z"/>
      </svg>
    ),
  },
  expedia: {
    bg: '#FFC72C', color: '#1a1a1a',
    icon: <span style={{ fontWeight: 900, fontSize: 16, color: '#1a1a1a' }}>E</span>,
  },
  vrbo: {
    bg: '#1B5E96', color: 'white',
    icon: <span style={{ fontWeight: 900, fontSize: 13, color: 'white' }}>VRBO</span>,
  },
};

// ── Stars ────────────────────────────────────────────────────────────────────

function Stars({ n, max = 5 }: { n: number; max?: number }) {
  const filled = Math.round((n / max) * 5);
  return (
    <span style={{ color: 'var(--accent)', letterSpacing: 1, fontSize: 12 }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  return <>{(parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()}</>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Reviews section: per-platform ratings + individual review cards. */
export function Reviews({ show, reviews = [], platformRatings = [] }: Props) {
  if (!show || (platformRatings.length === 0 && reviews.length === 0)) return null;

  const validPlatforms = platformRatings.filter(p => p.platform.trim() && p.rating > 0);

  return (
    <div className="lp-section" id="reviews">
      <h2 className="lp-section-title">Lo que dicen los huéspedes</h2>

      {/* Platform rating cards */}
      {validPlatforms.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
          {validPlatforms.map((p, i) => {
            // Detect scale: if rating > 5 assume it's /10 (Booking), else /5 (Google, Airbnb)
            const isOutOf10 = p.rating > 5;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)' }}>
                <PlatformIcon platform={p.platform} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.platform}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)', lineHeight: 1, letterSpacing: '-.02em' }}>
                      {isOutOf10 ? p.rating.toFixed(1) : p.rating.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>/ {isOutOf10 ? '10' : '5'}</span>
                  </div>
                  {!isOutOf10 && <Stars n={p.rating} />}
                  {p.count > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                      {p.count.toLocaleString('es-ES')} reseñas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual review cards */}
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
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
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
