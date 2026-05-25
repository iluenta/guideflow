'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { getPricingForProperty, createPricePeriod } from '@/app/actions/pricing';
import type { PricePeriod } from '@/lib/types/pricing';
import { validatePeriods } from '@/lib/pricing/calculator';
import { PeriodCard } from './PeriodCard';

interface Props {
  propertyId: string;
}

const INPUT: React.CSSProperties = {
  padding: '7px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  marginBottom: 3,
  display: 'block',
};

const EMPTY_FORM = { period_name: '', start_date: '', end_date: '', price_per_night: '' };

export function PricingEditor({ propertyId }: Props) {
  const [periods, setPeriods] = useState<PricePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  // Validation errors shown in real time
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    getPricingForProperty(propertyId)
      .then(setPeriods)
      .catch(() => toast.error('Error al cargar períodos de precio'))
      .finally(() => setLoading(false));
  }, [propertyId]);

  // ── Real-time validation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!form.start_date || !form.end_date || !form.price_per_night) {
      setValidationErrors([]);
      return;
    }
    const candidate: PricePeriod = {
      id: '__new__',
      property_id: propertyId,
      tenant_id: '',
      period_name: form.period_name || 'Nuevo período',
      start_date: form.start_date,
      end_date: form.end_date,
      price_per_night: Number(form.price_per_night),
      exceptions: [],
      created_at: '',
      updated_at: '',
    };
    const result = validatePeriods([...periods, candidate]);
    setValidationErrors(result.errors);
  }, [form, periods, propertyId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const reset = () => {
    setForm(EMPTY_FORM);
    setAdding(false);
    setValidationErrors([]);
  };

  const handleCreate = () => {
    if (!form.period_name.trim()) return toast.error('Nombre del período requerido');
    if (!form.start_date || !form.end_date) return toast.error('Fechas requeridas');
    if (form.end_date <= form.start_date) return toast.error('La fecha de fin debe ser posterior a la de inicio');
    if (!form.price_per_night || Number(form.price_per_night) <= 0) return toast.error('Precio debe ser > 0');
    if (validationErrors.length > 0) return toast.error('Corrige los errores antes de guardar');

    startTransition(async () => {
      try {
        const created = await createPricePeriod(propertyId, {
          period_name: form.period_name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          price_per_night: Number(form.price_per_night),
        });
        setPeriods(prev =>
          [...prev, created].sort((a, b) => a.start_date.localeCompare(b.start_date)),
        );
        reset();
        toast.success(`Período "${created.period_name}" creado`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear período');
      }
    });
  };

  const handleUpdated = (updated: PricePeriod) => {
    setPeriods(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleDeleted = (periodId: string) => {
    setPeriods(prev => prev.filter(p => p.id !== periodId));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
        Cargando períodos de precio…
      </div>
    );
  }

  return (
    <div>
      {/* Info box */}
      <div
        style={{
          padding: '10px 12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 8,
          fontSize: 12,
          color: '#0369a1',
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        <strong>Temporadas dinámicas</strong>: define rangos con precios distintos (Temporada Alta, Media, Baja…).
        Añade <em>excepciones</em> dentro de cada temporada para festivos o puentes.
        <br />
        Cuando el viajero selecciona fechas, el precio se calcula <strong>día a día</strong>. Si una noche no
        cae en ningún período, se usa el precio base de la landing.
      </div>

      {/* Period list */}
      {periods.length === 0 ? (
        <div
          style={{
            padding: 16,
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: 13,
            border: '1px dashed #e5e7eb',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Aún no hay temporadas definidas. Añade la primera.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {periods.map(period => (
            <PeriodCard
              key={period.id}
              period={period}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div
          style={{
            padding: 14,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
            Nueva temporada
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Nombre de la temporada</label>
              <input
                style={INPUT}
                placeholder="Ej: Temporada Alta, Verano, Semana Santa…"
                value={form.period_name}
                onChange={e => setForm(f => ({ ...f, period_name: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Fecha inicio</label>
              <input
                type="date"
                style={INPUT}
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Fecha fin (exclusiva)</label>
              <input
                type="date"
                style={INPUT}
                min={form.start_date}
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Precio / noche (€)</label>
              <input
                type="number"
                min={1}
                style={INPUT}
                placeholder="Ej: 80"
                value={form.price_per_night}
                onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))}
              />
            </div>
          </div>

          {/* Real-time validation errors */}
          {validationErrors.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 6,
              }}
            >
              {validationErrors.map((err, i) => (
                <div key={i} style={{ fontSize: 12, color: '#b91c1c' }}>
                  ⚠ {err}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={handleCreate}
              disabled={isPending || validationErrors.length > 0}
              style={{
                padding: '7px 14px',
                background: validationErrors.length > 0 ? '#e5e7eb' : '#6366f1',
                color: validationErrors.length > 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: (isPending || validationErrors.length > 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Guardando…' : 'Crear temporada'}
            </button>
            <button
              onClick={reset}
              style={{
                padding: '7px 14px',
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'none',
            border: '1px dashed #a5b4fc',
            borderRadius: 8,
            fontSize: 13,
            color: '#6366f1',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + Añadir temporada
        </button>
      )}
    </div>
  );
}
