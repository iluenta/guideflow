'use client';

import { useState } from 'react';
import type { Guests } from '@/lib/types/booking';
import type { PriceBreakdownItem } from '@/lib/types/pricing';
import { formatLongDate, formatPrice } from '@/lib/landing/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactForm {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  pais: string;
}

/** Data the modal passes up to BookingWidget for the server call. */
export interface ModalFormData {
  contact: ContactForm;
  paymentMethod?: string;
}

interface SubmitResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ModalFormData) => Promise<SubmitResult>;
  checkIn: Date;
  checkOut: Date;
  total: number;
  guests: Guests;
  propertyName?: string;
  coverImage?: string;
  pricePerNight?: number;
  nights?: number;
  dynamicBreakdown?: PriceBreakdownItem[];
}

// ─── Country list ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  'España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Reino Unido',
  'Países Bajos', 'Bélgica', 'Suiza', 'Austria', 'Suecia', 'Noruega',
  'Dinamarca', 'Polonia', 'Estados Unidos', 'Canadá', 'México', 'Argentina',
  'Brasil', 'Colombia', 'Chile', 'Japón', 'Australia', 'Otro',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ReservationModal({
  isOpen, onClose, onSubmit,
  checkIn, checkOut, total, guests,
  propertyName, coverImage, pricePerNight, nights,
  dynamicBreakdown,
}: Props) {
  // Group consecutive nights with same price+label for sidebar display
  const groupedBreakdown = (() => {
    if (!dynamicBreakdown || dynamicBreakdown.length === 0) return null;
    const groups: { label: string; price: number; count: number }[] = [];
    for (const item of dynamicBreakdown) {
      const last = groups[groups.length - 1];
      if (last && last.price === item.price && last.label === item.label) {
        last.count++;
      } else {
        groups.push({ label: item.label, price: item.price, count: 1 });
      }
    }
    return groups;
  })();
  const [contact, setContact] = useState<ContactForm>({
    nombre: '', apellidos: '', email: '', telefono: '', pais: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reservationId, setReservationId] = useState('');

  if (!isOpen) return null;

  const canSubmit = (
    contact.nombre.trim() &&
    contact.apellidos.trim() &&
    contact.email.trim() &&
    contact.telefono.trim() &&
    !submitting
  );

  const setC = (partial: Partial<ContactForm>) => setContact(c => ({ ...c, ...partial }));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const result = await onSubmit({ contact });
    setSubmitting(false);
    if (result.success && result.reservationId) {
      setReservationId(result.reservationId);
    } else {
      setError(result.error ?? 'Error al procesar la solicitud. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <style>{`
        @keyframes lp-check-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-modal-animate { animation: lp-fade-in .25s ease-out both; }
        .lp-success-check-animated { animation: lp-check-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div className="lp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="lp-modal lp-modal-animate">
          <button className="lp-modal-close" onClick={onClose} aria-label="Cerrar">×</button>

          {/* ── Success state ── */}
          {reservationId ? (
            <div className="lp-success">
              <div className="lp-success-check lp-success-check-animated">✓</div>
              <h3>¡Pre-reserva recibida!</h3>
              <p>
                Referencia: <strong>{reservationId.slice(0, 8).toUpperCase()}</strong><br /><br />
                Hemos enviado los detalles a <strong>{contact.email}</strong>.<br /><br />
                El anfitrión revisará tu solicitud y te confirmará la reserva en breve.
              </p>
              <button
                onClick={onClose}
                style={{ marginTop: 24, padding: '12px 28px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                Entendido
              </button>
            </div>
          ) : (
            <>
              {/* ── Form ── */}
              <div className="lp-modal-form">
                <div className="lp-modal-eyebrow">Reserva directa</div>
                <div className="lp-modal-title">Solicita tu estancia</div>

                {/* Date summary */}
                <div className="lp-form-split">
                  <div className="lp-form-row">
                    <label>Entrada</label>
                    <input readOnly value={formatLongDate(checkIn)} />
                  </div>
                  <div className="lp-form-row">
                    <label>Salida</label>
                    <input readOnly value={formatLongDate(checkOut)} />
                  </div>
                </div>

                {/* Contact */}
                <div className="lp-form-split">
                  <div className="lp-form-row">
                    <label>Nombre *</label>
                    <input
                      placeholder="María"
                      value={contact.nombre}
                      onChange={e => setC({ nombre: e.target.value })}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="lp-form-row">
                    <label>Apellidos *</label>
                    <input
                      placeholder="García López"
                      value={contact.apellidos}
                      onChange={e => setC({ apellidos: e.target.value })}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="lp-form-split">
                  <div className="lp-form-row">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={contact.email}
                      onChange={e => setC({ email: e.target.value })}
                      autoComplete="email"
                    />
                  </div>
                  <div className="lp-form-row">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      placeholder="+34 600 000 000"
                      value={contact.telefono}
                      onChange={e => setC({ telefono: e.target.value })}
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div className="lp-form-row">
                  <label>País de procedencia</label>
                  <select
                    value={contact.pais}
                    onChange={e => setC({ pais: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', fontSize: 14, color: contact.pais ? 'var(--ink)' : 'var(--ink-mute)', outline: 'none' }}
                  >
                    <option value="">Seleccionar país</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Info box */}
                <div style={{ padding: '12px 14px', background: 'var(--bg-deep)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>ℹ️</span>
                  <span>
                    Al enviar tu solicitud, el anfitrión la revisará y te confirmará la disponibilidad.
                    El pago se acordará directamente con el anfitrión.
                  </span>
                </div>

                {error && <div className="lp-modal-error">{error}</div>}

                <button
                  type="button"
                  className="lp-modal-cta"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Enviando solicitud…
                    </span>
                  ) : (
                    `Solicitar reserva · ${formatPrice(total)}`
                  )}
                </button>
                <p style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 8 }}>
                  Sin comisiones de plataforma · El anfitrión confirmará tu solicitud
                </p>
              </div>

              {/* ── Sidebar summary ── */}
              <div className="lp-modal-side">
                <div className="lp-modal-thumb">
                  {coverImage
                    ? <img src={coverImage} alt={propertyName ?? 'Alojamiento'} />
                    : <div className="lp-modal-thumb-placeholder">{propertyName}</div>
                  }
                </div>
                {propertyName && <h4>{propertyName}</h4>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  {groupedBreakdown ? (
                    groupedBreakdown.map((g, i) => (
                      <div className="lp-bb-row" key={i}>
                        <span>{g.label} · {formatPrice(g.price)} × {g.count}n</span>
                        <span>{formatPrice(g.price * g.count)}</span>
                      </div>
                    ))
                  ) : (nights && pricePerNight && (
                    <div className="lp-bb-row">
                      <span>{formatPrice(pricePerNight)} × {nights}n</span>
                      <span>{formatPrice(pricePerNight * nights)}</span>
                    </div>
                  ))}
                  <div className="lp-bb-row lp-bb-total">
                    <span>Total estimado</span><span>{formatPrice(total)}</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
                    <div>📅 {formatLongDate(checkIn)}</div>
                    <div style={{ marginTop: 4 }}>📅 {formatLongDate(checkOut)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
