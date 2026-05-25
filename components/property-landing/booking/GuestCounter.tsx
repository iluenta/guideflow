import type { Guests } from '@/lib/types/booking';

interface GuestRow {
  key: keyof Guests;
  label: string;
  sub: string;
  min: number;
  max: number;
}

interface Props {
  guests: Guests;
  petFeeEnabled: boolean;
  onChange: (guests: Guests) => void;
  onClose: () => void;
}

// Per-type limits
const BASE_ROWS: GuestRow[] = [
  { key: 'adults',   label: 'Adultos',  sub: '13 años o más',      min: 1, max: 4 },
  { key: 'children', label: 'Niños',    sub: '2–12 años',           min: 0, max: 4 },
  { key: 'infants',  label: 'Bebés',    sub: 'Menos de 2 años',     min: 0, max: 2 },
  { key: 'pets',     label: 'Mascotas', sub: 'Con suplemento',      min: 0, max: 2 },
];

const MAX_OCCUPANTS = 4; // adults + children

/**
 * Presentational guest counter.
 * Enforces per-type limits and a combined adults+children cap of MAX_OCCUPANTS.
 */
export function GuestCounter({ guests, petFeeEnabled, onChange, onClose }: Props) {
  const occupants = guests.adults + guests.children;

  const rows = BASE_ROWS.filter(r => r.key !== 'pets' || petFeeEnabled);

  const canIncrement = (key: keyof Guests, currentMax: number): boolean => {
    if (guests[key] >= currentMax) return false;
    if ((key === 'adults' || key === 'children') && occupants >= MAX_OCCUPANTS) return false;
    return true;
  };

  const handleChange = (key: keyof Guests, delta: number) => {
    const row = BASE_ROWS.find(r => r.key === key)!;
    const next = guests[key] + delta;
    if (next < row.min || next > row.max) return;
    if (delta > 0 && (key === 'adults' || key === 'children') && occupants >= MAX_OCCUPANTS) return;
    onChange({ ...guests, [key]: next });
  };

  return (
    <div className="lp-guests-popup">
      {rows.map(({ key, label, sub, min, max }) => (
        <div key={key} className="lp-guest-row">
          <div className="lp-guest-label">
            <strong>{label}</strong>
            <small>{sub}</small>
          </div>
          <div className="lp-guest-counter">
            <button
              className="lp-guest-btn"
              disabled={guests[key] <= min}
              onClick={() => handleChange(key, -1)}
              aria-label={`Reducir ${label}`}
            >
              −
            </button>
            <span className="lp-guest-count">{guests[key]}</span>
            <button
              className="lp-guest-btn"
              disabled={!canIncrement(key, max)}
              onClick={() => handleChange(key, +1)}
              aria-label={`Aumentar ${label}`}
            >
              +
            </button>
          </div>
        </div>
      ))}
      {occupants >= MAX_OCCUPANTS && (
        <p style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 8 }}>
          Máximo {MAX_OCCUPANTS} huéspedes (adultos + niños).
        </p>
      )}
      <button
        onClick={onClose}
        style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
      >
        Cerrar
      </button>
    </div>
  );
}
