"use client";

import { cn } from "@/lib/utils";

interface IaLogEntry {
  id: string;
  created_at: string;
  operation: string;
  model: string;
  cost_usd: number;
  tokens_total: number;
  duration_ms: number | null;
  is_error: boolean;
}

interface IaDetailLogProps {
  entries: IaLogEntry[];
  isLoading?: boolean;
}

const OP_BADGE: Record<string, { label: string; className: string }> = {
  chat:                  { label: "Chat",          className: "bg-blue-50 text-blue-700" },
  translation:           { label: "Traducción",    className: "bg-teal-50 text-teal-700" },
  intent:                { label: "Intent",        className: "bg-teal-50 text-teal-700" },
  fill_context:          { label: "Contexto",      className: "bg-purple-50 text-purple-700" },
  manual_vision:         { label: "Visión",        className: "bg-orange-50 text-orange-700" },
  manual_enrichment:     { label: "Enriquec.",     className: "bg-orange-50 text-orange-700" },
  arrival:               { label: "Llegada",       className: "bg-indigo-50 text-indigo-700" },
  ingestion:             { label: "Ingesta",       className: "bg-slate-100 text-slate-600" },
  geocoding_validation:  { label: "Geocoding",     className: "bg-slate-100 text-slate-600" },
};

function fmtTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function IaDetailLog({ entries, isLoading }: IaDetailLogProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#000d37] font-manrope">Consumos Detallados</h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded tracking-widest uppercase">
          Live View
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-50 animate-pulse rounded" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-300">
            Sin registros de IA este mes
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Operación</th>
                <th className="px-6 py-3">Modelo</th>
                <th className="px-6 py-3 text-right">Coste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map(entry => {
                const badge = OP_BADGE[entry.operation] ?? { label: entry.operation, className: "bg-slate-100 text-slate-600" };
                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      entry.is_error && "bg-red-50/50"
                    )}
                  >
                    <td className="px-6 py-3 text-[11px] text-slate-500 font-mono">{fmtTime(entry.created_at)}</td>
                    <td className="px-6 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-700">{entry.model}</td>
                    <td className={cn(
                      "px-6 py-3 text-xs text-right font-bold",
                      entry.cost_usd > 0.01 ? "text-red-600" : "text-[#000d37]"
                    )}>
                      ${entry.cost_usd.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
