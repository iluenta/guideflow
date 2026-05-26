import React from 'react';

interface Policies {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  minStay: number;
}

interface Props {
  policies: Policies;
  petFee: number;
}

// ── Inline SVG icons ────────────────────────────────────────────────────────
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconDoor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>
    <path d="M15 3h6v6"/>
    <path d="M10 14 21 3"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconPaw = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="8" r="2"/>
    <circle cx="17" cy="8" r="2"/>
    <circle cx="4" cy="14" r="2"/>
    <circle cx="20" cy="14" r="2"/>
    <path d="M12 18c-3.5 0-6-2-6-5 0-1 .5-2 1.5-2.5C8.5 10 10 9 12 9s3.5 1 4.5 1.5C17.5 11 18 12 18 13c0 3-2.5 5-6 5z"/>
  </svg>
);

const IconRefund = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconNight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ── Card ────────────────────────────────────────────────────────────────────
function RuleCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="lp-rule">
      <div className="lp-rule-icon">{icon}</div>
      <div className="lp-rule-body">
        <strong className="lp-rule-title">{title}</strong>
        <span className="lp-rule-sub">{subtitle}</span>
      </div>
    </div>
  );
}

/** House rules / policies cards grid — 3-col with icons. */
export function HouseRules({ policies, petFee }: Props) {
  // Check-in label: "Check-in HH:MM"
  const checkInLabel  = `Check-in ${policies.checkIn}`;
  const checkOutLabel = `Check-out ${policies.checkOut}`;

  const cards: { icon: React.ReactNode; title: string; subtitle: string }[] = [
    {
      icon: <IconClock />,
      title: checkInLabel,
      subtitle: 'Acceso autónomo con caja fuerte',
    },
    {
      icon: <IconDoor />,
      title: checkOutLabel,
      subtitle: 'Late check-out bajo disponibilidad',
    },
    ...(policies.minStay > 1
      ? [{
          icon: <IconNight />,
          title: 'Estancia mínima',
          subtitle: `${policies.minStay} noche${policies.minStay !== 1 ? 's' : ''}`,
        }]
      : []),
    ...(petFee > 0
      ? [{
          icon: <IconPaw />,
          title: 'Mascotas bienvenidas',
          subtitle: `Con suplemento de ${petFee} €`,
        }]
      : []),
    ...(policies.cancellation
      ? [{
          icon: <IconRefund />,
          title: 'Cancelación',
          subtitle: policies.cancellation,
        }]
      : []),
  ];

  return (
    <div className="lp-section">
      <h2 className="lp-section-title">Información práctica</h2>
      <div className="lp-rules">
        {cards.map((c, i) => (
          <RuleCard key={i} icon={c.icon} title={c.title} subtitle={c.subtitle} />
        ))}
      </div>
    </div>
  );
}
