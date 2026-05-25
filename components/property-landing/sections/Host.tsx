interface Props {
  name?: string;
  bio?: string;
  email: string;
  phone?: string;
}

function initials(name: string) {
  const p = name.trim().split(' ');
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
}

/** Host profile section: avatar, name, bio, and contact links. */
export function Host({ name, bio, email, phone }: Props) {
  if (!name) return null;

  return (
    <div className="lp-section">
      <h2 className="lp-section-title">Anfitrión</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, padding: 28, background: 'white', border: '1px solid var(--rule)', borderRadius: 'var(--r-lg)', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28 }}>
            {initials(name)}
          </div>
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, background: 'var(--accent)', borderRadius: '50%', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            ✓
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 12 }}>{name}</div>
          {bio && (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, marginBottom: 14 }}>{bio}</p>
          )}
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <a href={`mailto:${email}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>✉ {email}</a>
            {phone && <a href={`tel:${phone}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>📞 {phone}</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
