'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import {
  getBlockedPeriodsForProperty,
  createBlockedPeriod,
  deleteBlockedPeriod,
} from '@/app/actions/blocked-periods';
import type { BlockedPeriod, BlockReason } from '@/lib/types/blocked-periods';
import { BLOCK_REASON_LABELS, BLOCK_REASON_OPTIONS } from '@/lib/types/blocked-periods';

interface Props {
  propertyId: string;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

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

// ─── Period row ───────────────────────────────────────────────────────────────

function PeriodRow({
  period,
  onDeleted,
}: {
  period: BlockedPeriod;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`¿Eliminar el período cerrado "${BLOCK_REASON_LABELS[period.reason]}" (${period.start_date} → ${period.end_date})?`)) return;
    startTransition(async () => {
      try {
        await deleteBlockedPeriod(period.id);
        onDeleted(period.id);
        toast.success('Período cerrado eliminado');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar');
      }
    });
  };

  // Night count (inclusive)
  const ms = new Date(period.end_date).getTime() - new Date(period.start_date).getTime();
  const days = Math.round(ms / 86_400_000) + 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        background: '#fff5f5',
        border: '1px solid #fecaca',
        borderRadius: 8,
      }}
    >
      {/* Icon + info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>
          {BLOCK_REASON_LABELS[period.reason]}
        </div>
        <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 2 }}>
          {period.start_date} → {period.end_date}
          <span style={{ marginLeft: 6, opacity: 0.7 }}>({days} día{days !== 1 ? 's' : ''})</span>
        </div>
        {period.notes && (
          <div style={{ fontSize: 11, color: '#374151', marginTop: 3, fontStyle: 'italic' }}>
            "{period.notes}"
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Eliminar período cerrado"
        style={{
          background: 'none',
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          color: '#ef4444',
          fontSize: 18,
          lineHeight: 1,
          padding: '2px 4px',
          opacity: isPending ? 0.5 : 0.8,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

const EMPTY_FORM = { start_date: '', end_date: '', reason: 'otro' as BlockReason, notes: '' };

export function BlockedPeriodsEditor({ propertyId }: Props) {
  const [periods, setPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  // Load on mount
  useEffect(() => {
    getBlockedPeriodsForProperty(propertyId)
      .then(setPeriods)
      .catch(() => toast.error('Error al cargar períodos cerrados'))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const reset = () => { setForm(EMPTY_FORM); setAdding(false); };

  const handleCreate = () => {
    if (!form.start_date || !form.end_date) return toast.error('Selecciona las fechas de inicio y fin');
    if (form.end_date < form.start_date) return toast.error('La fecha de fin debe ser posterior o igual a la de inicio');

    startTransition(async () => {
      try {
        const created = await createBlockedPeriod(propertyId, {
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
          notes: form.notes.trim() || undefined,
        });
        setPeriods(prev =>
          [...prev, created].sort((a, b) => a.start_date.localeCompare(b.start_date)),
        );
        reset();
        toast.success(`Período cerrado: ${BLOCK_REASON_LABELS[form.reason]}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear período');
      }
    });
  };

  if (loading) {
    return <div style={{ padding: '12px 0', fontSize: 13, color: '#9ca3af' }}>Cargando…</div>;
  }

  return (
    <div>
      {/* Info box */}
      <div
        style={{
          padding: '10px 12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontSize: 12,
          color: '#991b1b',
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        <strong>Períodos cerrados</strong>: bloquea fechas por obras, limpieza, vacaciones, etc.
        Los días cerrados aparecen en <strong style={{ color: '#ef4444' }}>rojo</strong> en el calendario
        de la landing y no pueden reservarse.
      </div>

      {/* Period list */}
      {periods.length === 0 ? (
        <div
          style={{
            padding: 14,
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: 13,
            border: '1px dashed #e5e7eb',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Sin períodos cerrados. La propiedad está disponible todo el año salvo reservas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {periods.map(p => (
            <PeriodRow key={p.id} period={p} onDeleted={id => setPeriods(prev => prev.filter(x => x.id !== id))} />
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
            Cerrar período
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LABEL}>Desde (incluido)</label>
              <input
                type="date"
                style={INPUT}
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={LABEL}>Hasta (incluido)</label>
              <input
                type="date"
                style={INPUT}
                min={form.start_date}
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Razón</label>
              <select
                style={{ ...INPUT }}
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value as BlockReason }))}
              >
                {BLOCK_REASON_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Notas (opcional)</label>
              <textarea
                style={{ ...INPUT, resize: 'vertical', minHeight: 56 }}
                placeholder="Ej: Reforma del baño principal, empresa Reformas García"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={handleCreate}
              disabled={isPending || !form.start_date || !form.end_date}
              style={{
                padding: '7px 14px',
                background: (!form.start_date || !form.end_date) ? '#e5e7eb' : '#ef4444',
                color: (!form.start_date || !form.end_date) ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: (isPending || !form.start_date || !form.end_date) ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Guardando…' : 'Cerrar período'}
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
            border: '1px dashed #fca5a5',
            borderRadius: 8,
            fontSize: 13,
            color: '#ef4444',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + Cerrar período
        </button>
      )}
    </div>
  );
}
