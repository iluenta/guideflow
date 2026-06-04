interface Props {
  title?: string;
  beds?: number;
  baths?: number;
  maxGuests?: number;
  floor?: string;
  sizeSqm?: number;
  description?: string;
}

interface StatItem { value: string; label: string }

/** Property summary: big-number stats grid + description text. */
export function PropertyDetails({ title, beds, baths, maxGuests, floor, sizeSqm, description }: Props) {
  const stats: StatItem[] = [
    maxGuests ? { value: String(maxGuests).padStart(2, '0'), label: 'Personas' }    : null,
    beds      ? { value: String(beds).padStart(2, '0'),      label: 'Dormitorios' } : null,
    baths     ? { value: String(baths).padStart(2, '0'),     label: 'Baños' }       : null,
    sizeSqm   ? { value: String(Math.round(sizeSqm)),        label: 'm²' }          : null,
  ].filter(Boolean) as StatItem[];

  return (
    <div className="lp-section" id="about">
      {title && <h2 className="lp-section-title">{title}</h2>}

      {stats.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          gap: '1px',
          background: 'var(--rule)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          marginBottom: 28,
          border: '1px solid var(--rule)',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg)',
              padding: '20px 12px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontWeight: 700,
                color: 'var(--ink)',
                lineHeight: 1,
                letterSpacing: '-.03em',
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-mute)',
                marginTop: 6,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {description && <p className="lp-desc">{description}</p>}
    </div>
  );
}
