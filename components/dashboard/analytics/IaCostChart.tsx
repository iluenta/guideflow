"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area
} from "recharts";
import { cn } from "@/lib/utils";

interface DayData {
  day: string;       // "01 Oct"
  cost: number;      // USD
  tokens: number;
  calls: number;
}

interface OpData {
  operation: string;
  calls: number;
  cost: number;
}

interface IaCostChartProps {
  dailyData: DayData[];
  opData: OpData[];
  isLoading?: boolean;
}

const OP_LABELS: Record<string, string> = {
  chat: "Chat",
  intent: "Intent",
  translation: "Traducción",
  fill_context: "Contexto",
  arrival: "Llegada",
  manual_vision: "Manuales",
  manual_enrichment: "Enriquecimiento",
  ingestion: "Ingesta",
  geocoding_validation: "Geocodificación",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">
            {p.name === "Coste" ? `$${p.value.toFixed(4)}` : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export function IaCostChart({ dailyData, opData, isLoading }: IaCostChartProps) {
  const [view, setView] = useState<"daily" | "ops">("daily");

  const maxCost = useMemo(() => Math.max(...dailyData.map(d => d.cost), 0.001), [dailyData]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#000d37] font-manrope">Uso de IA y Costes</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView("daily")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded transition-colors",
              view === "daily" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            Costo Diario
          </button>
          <button
            onClick={() => setView("ops")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded transition-colors",
              view === "ops" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            Operaciones
          </button>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[280px] bg-slate-50 rounded-xl animate-pulse" />
      ) : dailyData.length === 0 && view === "daily" ? (
        <div className="h-[280px] flex items-center justify-center text-slate-300 text-sm">
          Sin datos de uso de IA este mes
        </div>
      ) : view === "daily" ? (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000d37" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#1e40af" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={v => v === 0 ? "" : `$${v.toFixed(3)}`}
              tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" name="Coste" fill="url(#costGradient)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Line
              dataKey="cost"
              name="Tendencia"
              type="monotone"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        /* Operaciones view */
        <div className="space-y-3 py-2">
          {opData.length === 0 ? (
            <p className="text-center text-slate-300 text-sm py-16">Sin datos</p>
          ) : opData.map((op, i) => {
            const maxCalls = Math.max(...opData.map(o => o.calls), 1);
            const pct = Math.round((op.calls / maxCalls) * 100);
            return (
              <div key={i} className="flex items-center gap-4">
                <span className="w-28 shrink-0 text-xs font-semibold text-slate-600 truncate">
                  {OP_LABELS[op.operation] ?? op.operation}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#000d37] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-right text-xs font-bold text-slate-700 shrink-0">{op.calls}</span>
                <span className="w-16 text-right text-xs text-slate-400 shrink-0">${op.cost.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* X-axis labels for daily */}
      {!isLoading && view === "daily" && dailyData.length > 0 && (
        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-3">
          {["01", "08", "15", "22", "30"].map(d => (
            <span key={d}>{d}</span>
          ))}
        </div>
      )}
    </div>
  );
}
