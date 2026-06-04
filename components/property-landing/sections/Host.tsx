interface Props {
  name?: string;
  bio?: string;
  email?: string;
  phone?: string;
}

function initials(name: string) {
  const p = name.trim().split(' ');
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
}

/** Host profile section: navy background, orange avatar, bio + family link. */
export function Host({ name, bio }: Props) {
  if (!name) return null;

  const firstName = name.trim().split(' ')[0];

  return (
    <div className="lp-section">
      <h2 className="lp-section-title">Anfitrión</h2>
      <div style={{
        padding: '32px 28px',
        background: '#0F172A',
        borderRadius: 'var(--r-lg)',
        color: 'white',
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Orange avatar */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: '-.01em',
              fontFamily: '"Fraunces", Georgia, serif',
            }}>
              {initials(name)}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: 22,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-.02em',
              marginBottom: 4,
            }}>
              {name}
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.4)',
              marginBottom: bio ? 14 : 0,
            }}>
              Anfitrión verificado
            </div>

            {bio && (
              <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,.7)',
                lineHeight: 1.65,
                margin: '0 0 16px',
              }}>
                {bio}
              </p>
            )}

            {/* "Name y Familia →" link */}
            <a
              href="#contact"
              style={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--accent)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {firstName} y su familia →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
