interface SummaryCard {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function Icon({ path, path2 }: { path: string; path2?: string }) {
  return (
    <span style={{ width: 36, height: 36, background: 'var(--bg-deep)', borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
        <path d={path} />
        {path2 && <path d={path2} />}
      </svg>
    </span>
  );
}

interface Props {
  title?: string;
  beds?: number;
  baths?: number;
  maxGuests?: number;
  floor?: string;
  sizeSqm?: number;
  description?: string;
}

/** Property summary: title, stat cards with icons, description text. */
export function PropertyDetails({ title, beds, baths, maxGuests, floor, sizeSqm, description }: Props) {
  const cards: SummaryCard[] = [
    maxGuests ? {
      label: 'Huéspedes',
      value: `${maxGuests} personas`,
      icon: <Icon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
    } : null,
    beds ? {
      label: 'Dormitorios',
      value: `${beds} dormitorio${beds !== 1 ? 's' : ''}`,
      icon: <Icon path="M2 4v16M2 8h18a2 2 0 012 2v10M2 16h20M6 8v8M10 8v8" />,
    } : null,
    baths ? {
      label: 'Baños',
      value: `${baths} baño${baths !== 1 ? 's' : ''}`,
      icon: <Icon path="M4 22h16M10 22V12M4 12h16M4 6a2 2 0 014 0v6H4V6z" path2="M14 6v6" />,
    } : null,
    sizeSqm ? {
      label: 'Tamaño',
      value: `${sizeSqm} m²`,
      icon: <Icon path="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
    } : null,
  ].filter(Boolean) as SummaryCard[];

  return (
    <div className="lp-section" id="about">
      {title && <h2 className="lp-section-title">{title}</h2>}

      {cards.length > 0 && (
        <div className="lp-summary">
          {cards.map(card => (
            <div key={card.label} className="lp-summary-item">
              {card.icon}
              <div>
                <small>{card.label}</small>
                <strong>{card.value}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {description && <p className="lp-desc">{description}</p>}
    </div>
  );
}
