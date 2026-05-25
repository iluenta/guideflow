'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addException, deleteException } from '@/app/actions/pricing';
import type { PricePeriod, PriceException } from '@/lib/types/pricing';

interface Props {
  period: PricePeriod;
  onUpdated: (updated: PricePeriod) => void;
}

const INPUT = {
  padding: '7px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box' as const,
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

function ExceptionRow({
  exc,
  periodId,
  onDeleted,
}: {
  exc: PriceException;
  periodId: string;
  onDeleted: (updated: PricePeriod) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const updated = await deleteException(periodId, exc.id);
        onDeleted(updated);
        toast.success(`Excepción "${exc.name}" eliminada`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al eliminar excepción');
      }
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: '#fef9c3',
        border: '1px solid #fde68a',
        borderRadius: 7,
        fontSize: 13,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#92400e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ⭐ {exc.name}
        </div>
        <div style={{ fontSize: 11, color: '#78350f', marginTop: 1 }}>
          {exc.start_date} → {exc.end_date} · <strong>{exc.price_per_night}€/noche</strong>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Eliminar excepción"
        style={{
          background: 'none',
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          color: '#ef4444',
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
          opacity: isPending ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

const EMPTY_FORM = { name: '', start_date: '', end_date: '', price_per_night: '' };

export function ExceptionList({ period, onUpdated }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setForm(EMPTY_FORM);
    setAdding(false);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return toast.error('Nombre requerido');
    if (!form.start_date || !form.end_date) return toast.error('Fechas requeridas');
    if (form.end_date <= form.start_date) return toast.error('La fecha de fin debe ser posterior a la de inicio');
    if (!form.price_per_night || Number(form.price_per_night) <= 0) return toast.error('Precio debe ser > 0');
    if (form.start_date < period.start_date || form.end_date > period.end_date) {
      return toast.error(`Las fechas deben estar dentro del período (${period.start_date} → ${period.end_date})`);
    }

    startTransition(async () => {
      try {
        const updated = await addException(period.id, {
          name: form.name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          price_per_night: Number(form.price_per_night),
        });
        onUpdated(updated);
        reset();
        toast.success('Excepción añadida');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al añadir excepción');
      }
    });
  };

  const exceptions = period.exceptions ?? [];

  return (
    <div style={{ marginTop: 8 }}>
      {/* Exception rows */}
      {exceptions.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
          Sin excepciones. Añade festivos o puentes para sobrescribir el precio base.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {exceptions.map(exc => (
            <ExceptionRow
              key={exc.id}
              exc={exc}
              periodId={period.id}
              onDeleted={onUpdated}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div
          style={{
            padding: 12,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            Nueva excepción
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Nombre</label>
              <input
                style={INPUT}
                placeholder="Ej: Semana Santa, Puente mayo…"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Fecha inicio</label>
              <input
                type="date"
                style={INPUT}
                min={period.start_date}
                max={period.end_date}
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Fecha fin</label>
              <input
                type="date"
                style={INPUT}
                min={form.start_date || period.start_date}
                max={period.end_date}
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Precio/noche (€)</label>
              <input
                type="number"
                min={1}
                style={INPUT}
                placeholder="Ej: 120"
                value={form.price_per_night}
                onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={handleAdd}
              disabled={isPending}
              style={{
                padding: '7px 14px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Guardando…' : 'Guardar excepción'}
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
            gap: 4,
            padding: '5px 10px',
            background: 'none',
            border: '1px dashed #d1d5db',
            borderRadius: 6,
            fontSize: 12,
            color: '#6b7280',
            cursor: 'pointer',
          }}
        >
          + Añadir excepción (festivo / puente)
        </button>
      )}
    </div>
  );
}
