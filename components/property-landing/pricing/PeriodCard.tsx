'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deletePricePeriod } from '@/app/actions/pricing';
import type { PricePeriod } from '@/lib/types/pricing';
import { ExceptionList } from './ExceptionList';

interface Props {
  period: PricePeriod;
  onUpdated: (updated: PricePeriod) => void;
  onDeleted: (periodId: string) => void;
}

const CARD: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: 'white',
  overflow: 'hidden',
};

const HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  cursor: 'pointer',
  userSelect: 'none',
};

export function PeriodCard({ period, onUpdated, onDeleted }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar el período "${period.period_name}"? También se borrarán sus excepciones.`)) return;

    startTransition(async () => {
      try {
        await deletePricePeriod(period.id);
        onDeleted(period.id);
        toast.success(`Período "${period.period_name}" eliminado`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar período');
      }
    });
  };

  const excCount = period.exceptions?.length ?? 0;

  return (
    <div style={CARD}>
      {/* ── Header row ── */}
      <div style={HEADER} onClick={() => setExpanded(e => !e)}>
        {/* Chevron */}
        <span style={{ fontSize: 12, color: '#9ca3af', transition: 'transform .15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>
          ▶
        </span>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
              {period.period_name}
            </span>
            <span
              style={{
                padding: '2px 8px',
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {period.price_per_night}€<span style={{ fontWeight: 400, color: '#4ade80' }}>/noche</span>
            </span>
            {excCount > 0 && (
              <span
                style={{
                  padding: '2px 7px',
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: 99,
                  fontSize: 11,
                }}
              >
                {excCount} excepción{excCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            {period.start_date} → {period.end_date}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Eliminar período"
          style={{
            background: 'none',
            border: 'none',
            cursor: isPending ? 'not-allowed' : 'pointer',
            color: '#ef4444',
            fontSize: 18,
            lineHeight: 1,
            padding: '2px 4px',
            opacity: isPending ? 0.5 : 0.7,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* ── Expanded: exceptions ── */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Excepciones (festivos / puentes)
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
              Las excepciones sobreescriben el precio base del período para fechas concretas.
            </div>
            <ExceptionList period={period} onUpdated={onUpdated} />
          </div>
        </div>
      )}
    </div>
  );
}
