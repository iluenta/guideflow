import React from 'react';

interface Policies {
  minStay: number;
  extraRules?: { title: string; note: string }[];
  checkIn?: string;
  checkOut?: string;
  cancellation?: string;
}

interface Props {
  policies: Policies;
  petFee: number;
}

// ── Inline SVG icons ────────────────────────────────────────────────────────
const IconPaw = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="8" r="2"/>
    <circle cx="17" cy="8" r="2"/>
    <circle cx="4" cy="14" r="2"/>
    <circle cx="20" cy="14" r="2"/>
    <path d="M12 18c-3.5 0-6-2-6-5 0-1 .5-2 1.5-2.5C8.5 10 10 9 12 9s3.5 1 4.5 1.5C17.5 11 18 12 18 13c0 3-2.5 5-6 5z"/>
  </svg>
);

const IconRule = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ── Card ────────────────────────────────────────────────────────────────────
function RuleCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="lp-rule">
      <div className="lp-rule-icon">{icon}</div>
      <div className="lp-rule-body">
        <strong className="lp-rule-title">{title}</strong>
        {subtitle && <span className="lp-rule-sub">{subtitle}</span>}
      </div>
    </div>
  );
}

/** House rules / policies cards grid — 3-col with icons.
 *
 * Auto-generated cards (always present when applicable):
 *   - Estancia mínima  (when minStay > 1)
 *   - Mascotas         (when petFee > 0)
 *
 * Everything else (check-in time, check-out time, no-smoking, no-parties,
 * cancellation policy…) is configured freely via policies.extraRules.
 */
export function HouseRules({ policies, petFee }: Props) {
  const cards: { icon: React.ReactNode; title: string; subtitle: string }[] = [
    ...(petFee > 0
      ? [{ icon: <IconPaw />, title: 'Mascotas bienvenidas', subtitle: `Con suplemento de ${petFee} €` }]
      : []),
    ...(policies.extraRules ?? [])
      .filter(r => r.title.trim())
      .map(r => ({ icon: <IconRule />, title: r.title, subtitle: r.note })),
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
