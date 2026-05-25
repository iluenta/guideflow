'use client';

import { useState } from 'react';
import type { Guests, PaymentMethod } from '@/lib/types/booking';
import { formatLongDate, formatPrice } from '@/lib/landing/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactForm {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  pais: string;
}

interface CardForm {
  numero: string;    // formatted "1234 5678 9012 3456"
  expiry: string;    // formatted "MM/YY"
  cvv: string;
}

/** Data the modal passes up to BookingWidget for the server call. */
export interface ModalFormData {
  contact: ContactForm;
  paymentMethod: PaymentMethod;
  card?: CardForm;
}

interface SubmitResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** BookingWidget builds ReservationRequest and calls createPublicBooking. */
  onSubmit: (data: ModalFormData) => Promise<SubmitResult>;
  checkIn: Date;
  checkOut: Date;
  total: number;
  guests: Guests;
  /** For the summary sidebar */
  propertyName?: string;
  coverImage?: string;
  pricePerNight?: number;
  nights?: number;
}

// ─── Country list ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  'España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Reino Unido',
  'Países Bajos', 'Bélgica', 'Suiza', 'Austria', 'Suecia', 'Noruega',
  'Dinamarca', 'Polonia', 'Estados Unidos', 'Canadá', 'México', 'Argentina',
  'Brasil', 'Colombia', 'Chile', 'Japón', 'Australia', 'Otro',
];

// ─── Card formatters ──────────────────────────────────────────────────────────

function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

// ─── Payment method config ────────────────────────────────────────────────────

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'card',   label: 'Tarjeta',     icon: '💳' },
  { id: 'bizum',  label: 'Bizum',       icon: '📱' },
  { id: 'apple',  label: 'Apple Pay',   icon: '' },
  { id: 'google', label: 'Google Pay',  icon: '' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ReservationModal({
  isOpen, onClose, onSubmit,
  checkIn, checkOut, total, guests,
  propertyName, coverImage, pricePerNight, nights,
}: Props) {
  const [contact, setContact] = useState<ContactForm>({
    nombre: '', apellidos: '', email: '', telefono: '', pais: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [card, setCard] = useState<CardForm>({ numero: '', expiry: '', cvv: '' });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reservationId, setReservationId] = useState('');

  if (!isOpen) return null;

  const isCardMethod = paymentMethod === 'card';
  const cardValid = !isCardMethod || (
    card.numero.replace(/\s/g, '').length === 16 &&
    card.expiry.length === 5 &&
    card.cvv.length >= 3
  );

  const canSubmit = (
    contact.nombre.trim() &&
    contact.apellidos.trim() &&
    contact.email.trim() &&
    contact.telefono.trim() &&
    cardValid &&
    !submitting
  );

  const setC = (partial: Partial<ContactForm>) => setContact(c => ({ ...c, ...partial }));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    const result = await onSubmit({
      contact,
      paymentMethod,
      card: isCardMethod ? card : undefined,
    });
    setSubmitting(false);

    if (result.success && result.reservationId) {
      setReservationId(result.reservationId);
    } else {
      setError(result.error ?? 'Error al procesar la reserva. Inténtalo de nuevo.');
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
        .lp-apple-icon { width: 22px; height: 14px; display: inline-block; background: #000; border-radius: 2px; position: relative; }
        .lp-apple-icon::after { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 12px; height: 14px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 814 1000'%3E%3Cpath fill='white' d='M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 268.5-317.3 71 0 130.4 46.9 175 46.9 42.9 0 109.7-49.7 188.3-49.7zm-174.6-72.1c33.1-39.4 55.5-94.1 55.5-148.8 0-7.7-.6-15.4-1.9-22.4-52.3 1.9-114.3 34.9-151.7 75.8-28.5 32.4-55.1 87.1-55.1 142.5 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 46.9 0 103.8-31.1 137.7-67.6z'/%3E%3C/svg%3E") center/contain no-repeat; }
        .lp-google-icon { width: 22px; height: 14px; display: inline-block; background: white; border-radius: 2px; border: 1px solid #e5e7eb; font-size: 10px; font-weight: 700; color: #4285f4; line-height: 14px; text-align: center; letter-spacing: -.5px; font-family: Arial, sans-serif; }
      `}</style>

      <div className="lp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="lp-modal lp-modal-animate">
          <button className="lp-modal-close" onClick={onClose} aria-label="Cerrar">×</button>

          {/* ── Success state ── */}
          {reservationId ? (
            <div className="lp-success">
              <div className="lp-success-check lp-success-check-animated">✓</div>
              <h3>¡Reserva confirmada!</h3>
              <p>
                Referencia: <strong>{reservationId.slice(0, 8).toUpperCase()}</strong><br /><br />
                Hemos enviado la confirmación a <strong>{contact.email}</strong>.<br />
                El anfitrión se pondrá en contacto contigo pronto.
              </p>
              <button
                onClick={onClose}
                style={{ marginTop: 24, padding: '12px 28px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* ── Form ── */}
              <div className="lp-modal-form">
                <div className="lp-modal-eyebrow">Reserva directa</div>
                <div className="lp-modal-title">Confirma tu estancia</div>

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

                {/* Payment method */}
                <div className="lp-form-row">
                  <label>Método de pago</label>
                  <div className="lp-pay-methods">
                    {PAYMENT_METHODS.map(({ id, label, icon }) => (
                      <button
                        key={id}
                        type="button"
                        className={`lp-pay-method${paymentMethod === id ? ' active' : ''}`}
                        onClick={() => setPaymentMethod(id)}
                        aria-pressed={paymentMethod === id}
                      >
                        {id === 'apple' ? (
                          <><span className="lp-apple-icon" />{label}</>
                        ) : id === 'google' ? (
                          <><span className="lp-google-icon">G</span>{label}</>
                        ) : (
                          <>{icon} {label}</>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card fields */}
                {isCardMethod && (
                  <div className="lp-form-row" style={{ border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', padding: 12, background: 'var(--bg)' }}>
                    <label style={{ marginBottom: 8 }}>Datos de tarjeta</label>
                    <input
                      placeholder="1234 5678 9012 3456"
                      value={card.numero}
                      onChange={e => setCard(c => ({ ...c, numero: formatCardNumber(e.target.value) }))}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={5}
                      />
                      <input
                        placeholder="CVV"
                        value={card.cvv}
                        onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        type="password"
                      />
                    </div>
                  </div>
                )}

                {/* Bizum/Apple/Google placeholder */}
                {paymentMethod === 'bizum' && (
                  <div style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center' }}>
                    📱 Recibirás una solicitud de pago por Bizum al confirmar.
                  </div>
                )}
                {(paymentMethod === 'apple' || paymentMethod === 'google') && (
                  <div style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center' }}>
                    {paymentMethod === 'apple' ? '' : '🔵'} Se abrirá la app de pago al confirmar.
                  </div>
                )}

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
                      Procesando…
                    </span>
                  ) : (
                    `Confirmar pago · ${formatPrice(total)}`
                  )}
                </button>
                <p style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 8 }}>
                  🔒 Pago seguro · Sin comisiones de plataforma
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
                  {nights && pricePerNight && (
                    <div className="lp-bb-row">
                      <span>{formatPrice(pricePerNight)} × {nights}n</span>
                      <span>{formatPrice(pricePerNight * nights)}</span>
                    </div>
                  )}
                  <div className="lp-bb-row lp-bb-total">
                    <span>Total</span><span>{formatPrice(total)}</span>
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
