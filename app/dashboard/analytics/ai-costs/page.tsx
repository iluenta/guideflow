"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ── Colores por operación ────────────────────────────────────────────────────
const OP_META: Record<string, { label: string; color: string; bg: string }> = {
  chat:                  { label: 'Chat huésped',       color: '#1e3a8a', bg: '#eff6ff' },
  intent:                { label: 'Clasificador',        color: '#7c3aed', bg: '#f5f3ff' },
  manual_vision:         { label: 'Visión manuales',     color: '#0891b2', bg: '#ecfeff' },
  fill_context:          { label: 'Recomendaciones',     color: '#059669', bg: '#ecfdf5' },
  arrival:               { label: 'Instrucciones llegada', color: '#d97706', bg: '#fffbeb' },
  geocoding_validation:  { label: 'Validación geocoding', color: '#64748b', bg: '#f8fafc' },
  manual_enrichment:     { label: 'Enriquecimiento manual', color: '#be185d', bg: '#fdf2f8' },
  ingestion:             { label: 'Ingesta IA',          color: '#ea580c', bg: '#fff7ed' },
  translation:           { label: 'Traducción',          color: '#2dd4bf', bg: '#f0fdfa' },
};

const MODEL_RATES: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gpt-4o-mini':      { input: 0.15,  output: 0.60 },
  'gpt-4o':           { input: 5.00,  output: 15.00 },
};

function fmtCost(usd: number) {
  if (usd < 0.001) return '<$0.001';
  if (usd < 0.01)  return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}
function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

// ── Componente KPI card ──────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '1a' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="font-jetbrains text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
          <p className="font-manrope text-[22px] font-bold text-slate-800 leading-none">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Barra de progreso horizontal ─────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

export default function AiCostsPage() {
  const { profile } = useUserProfile();
  const [days, setDays]           = useState<string>("30");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [rows, setRows]                = useState<any[]>([]);
  const [byOperation, setByOperation]  = useState<any[]>([]);
  const [byDay, setByDay]              = useState<any[]>([]);
  const [byProperty, setByProperty]    = useState<any[]>([]);
  const [properties, setProperties]    = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!profile?.tenant_id) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      const since = new Date();
      since.setDate(since.getDate() - Number(days));
      const sinceIso = since.toISOString();

      // Fetch properties for name lookup
      const { data: props } = await supabase
        .from("properties")
        .select("id, name")
        .eq("tenant_id", profile.tenant_id);
      setProperties(props || []);
      const propMap = Object.fromEntries((props || []).map((p: any) => [p.id, p.name]));

      // Fetch raw log rows for this tenant
      const { data: logRows, error } = await supabase
        .from("ai_usage_log")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(logRows || []);

      // Aggregate by operation
      const opMap: Record<string, { calls: number; tokens_prompt: number; tokens_output: number; cost_usd: number; errors: number }> = {};
      const dayMap: Record<string, { cost_usd: number; tokens_total: number }> = {};
      const propAgg: Record<string, { cost_usd: number; calls: number }> = {};

      for (const r of logRows || []) {
        // by operation
        if (!opMap[r.operation]) opMap[r.operation] = { calls: 0, tokens_prompt: 0, tokens_output: 0, cost_usd: 0, errors: 0 };
        opMap[r.operation].calls++;
        opMap[r.operation].tokens_prompt  += r.tokens_prompt  || 0;
        opMap[r.operation].tokens_output  += r.tokens_output  || 0;
        opMap[r.operation].cost_usd       += r.cost_usd       || 0;
        if (r.is_error) opMap[r.operation].errors++;

        // by day
        const day = r.created_at.slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { cost_usd: 0, tokens_total: 0 };
        dayMap[day].cost_usd      += r.cost_usd || 0;
        dayMap[day].tokens_total  += r.tokens_total || 0;

        // by property
        if (r.property_id) {
          if (!propAgg[r.property_id]) propAgg[r.property_id] = { cost_usd: 0, calls: 0 };
          propAgg[r.property_id].cost_usd += r.cost_usd || 0;
          propAgg[r.property_id].calls++;
        }
      }

      const opArr = Object.entries(opMap)
        .map(([op, v]) => ({ op, ...v }))
        .sort((a, b) => b.cost_usd - a.cost_usd);
      setByOperation(opArr);

      // Fill missing days with 0
      const dayArr: { day: string; cost_usd: number; tokens_total: number }[] = [];
      for (let i = Number(days) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayArr.push({ day: key, ...(dayMap[key] || { cost_usd: 0, tokens_total: 0 }) });
      }
      setByDay(dayArr);

      const propArr = Object.entries(propAgg)
        .map(([id, v]) => ({ id, name: propMap[id] || 'Propiedad eliminada', ...v }))
        .sort((a, b) => b.cost_usd - a.cost_usd)
        .slice(0, 8);
      setByProperty(propArr);

    } catch (err: any) {
      toast.error("Error cargando datos de uso");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.tenant_id, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Summary totals
  const totalCost    = rows.reduce((s, r) => s + (r.cost_usd || 0), 0);
  const totalTokens  = rows.reduce((s, r) => s + (r.tokens_total || 0), 0);
  const totalCalls   = rows.length;
  const totalErrors  = rows.filter(r => r.is_error).length;
  const maxDayCost   = Math.max(...byDay.map(d => d.cost_usd), 0.001);
  const maxOpCost    = byOperation[0]?.cost_usd || 0.001;
  const maxPropCost  = byProperty[0]?.cost_usd  || 0.001;

  const Skeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-100 rounded w-2/3" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="h-4 bg-slate-100 rounded w-3/4" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12 min-h-screen -m-4 p-4 md:-m-8 md:p-8 bg-slate-50">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-manrope font-bold text-[22px] text-slate-800 tracking-tight">Consumo de IA</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Tokens y coste estimado por operación · Gemini 2.5 Flash</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[130px] bg-white border-slate-200 rounded-xl text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}
            className="rounded-xl border-slate-200 text-[13px] gap-1.5">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Coste estimado" value={isLoading ? "—" : fmtCost(totalCost)} sub={`últimos ${days} días`} color="#1e3a8a" />
        <KpiCard icon={Zap}        label="Tokens totales" value={isLoading ? "—" : fmtTokens(totalTokens)} sub={`${totalCalls} llamadas`} color="#7c3aed" />
        <KpiCard icon={Clock}      label="Coste/llamada"  value={isLoading || totalCalls === 0 ? "—" : fmtCost(totalCost / totalCalls)} sub="promedio" color="#059669" />
        <KpiCard icon={AlertTriangle} label="Errores"     value={isLoading ? "—" : String(totalErrors)} sub={totalCalls > 0 ? `${((totalErrors / totalCalls) * 100).toFixed(1)}% tasa error` : undefined} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ── Gráfico de barras por día ────────────────────────────────── */}
        <Card className="xl:col-span-8 border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50">
            <CardTitle className="font-manrope font-semibold text-[15px] text-slate-700">Coste diario (USD)</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-5">
            {isLoading ? <Skeleton /> : byDay.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-8">Sin datos aún. Las llamadas a la IA aparecerán aquí.</p>
            ) : (
              <div className="space-y-1">
                {/* Eje Y implícito: etiqueta máximo */}
                <div className="flex justify-end mb-1">
                  <span className="font-jetbrains text-[9px] text-slate-300">{fmtCost(maxDayCost)} max</span>
                </div>
                <div className="flex items-end gap-1 h-36">
                  {byDay.map(({ day, cost_usd }) => {
                    const pct = maxDayCost > 0 ? (cost_usd / maxDayCost) * 100 : 0;
                    const label = day.slice(5); // MM-DD
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                          style={{ height: `${Math.max(pct, cost_usd > 0 ? 3 : 0)}%`, background: cost_usd > 0 ? '#1e3a8a' : '#e2e8f0', minHeight: cost_usd > 0 ? 3 : 0 }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                          <div className="bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap font-jetbrains">
                            {fmtCost(cost_usd)}
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Eje X — mostrar solo cada N días para no saturar */}
                <div className="flex items-end gap-1">
                  {byDay.map(({ day }, i) => {
                    const step = Number(days) <= 7 ? 1 : Number(days) <= 30 ? 5 : 10;
                    const show = i % step === 0 || i === byDay.length - 1;
                    return (
                      <div key={day} className="flex-1 text-center">
                        <span className="font-jetbrains text-[8px] text-slate-300">{show ? day.slice(5) : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Top modelos ─────────────────────────────────────────────── */}
        <Card className="xl:col-span-4 border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50">
            <CardTitle className="font-manrope font-semibold text-[15px] text-slate-700">Por operación</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-5">
            {isLoading ? <Skeleton /> : byOperation.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-8">Sin datos aún.</p>
            ) : (
              <div className="space-y-4">
                {byOperation.map(({ op, calls, tokens_prompt, tokens_output, cost_usd, errors }) => {
                  const meta = OP_META[op] ?? { label: op, color: '#64748b', bg: '#f8fafc' };
                  const pct  = maxOpCost > 0 ? (cost_usd / maxOpCost) * 100 : 0;
                  return (
                    <div key={op} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                          <span className="font-manrope text-[12px] font-medium text-slate-700">{meta.label}</span>
                          {errors > 0 && (
                            <span className="font-jetbrains text-[9px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">{errors} err</span>
                          )}
                        </div>
                        <span className="font-jetbrains text-[11px] font-bold text-slate-600">{fmtCost(cost_usd)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bar pct={pct} color={meta.color} />
                      </div>
                      <p className="font-jetbrains text-[9px] text-slate-400">
                        {calls} llamadas · {fmtTokens(tokens_prompt + tokens_output)} tokens
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Por propiedad ───────────────────────────────────────────── */}
        {byProperty.length > 0 && (
          <Card className="xl:col-span-6 border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50">
              <CardTitle className="font-manrope font-semibold text-[15px] text-slate-700">Top propiedades por coste</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5 space-y-4">
              {isLoading ? <Skeleton /> : byProperty.map(({ id, name, cost_usd, calls }) => {
                const pct = maxPropCost > 0 ? (cost_usd / maxPropCost) * 100 : 0;
                return (
                  <div key={id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-manrope text-[12px] font-medium text-slate-700 truncate max-w-[60%]">{name}</span>
                      <span className="font-jetbrains text-[11px] font-bold text-slate-600">{fmtCost(cost_usd)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bar pct={pct} color="#1e3a8a" />
                    </div>
                    <p className="font-jetbrains text-[9px] text-slate-400">{calls} llamadas</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Últimas llamadas (tabla) ─────────────────────────────────── */}
        <Card className={`${byProperty.length > 0 ? 'xl:col-span-6' : 'xl:col-span-12'} border-none shadow-sm bg-white rounded-2xl`}>
          <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50">
            <CardTitle className="font-manrope font-semibold text-[15px] text-slate-700">Últimas 50 llamadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><Skeleton /></div>
            ) : rows.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-8">Sin datos aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      {['Hora', 'Operación', 'Modelo', 'Prompt', 'Output', 'Coste', 'ms'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-jetbrains text-[9px] uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r) => {
                      const meta = OP_META[r.operation] ?? { label: r.operation, color: '#64748b', bg: '#f8fafc' };
                      const ts   = new Date(r.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      return (
                        <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${r.is_error ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-2.5 font-jetbrains text-slate-400 whitespace-nowrap">{ts}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: meta.bg, color: meta.color }}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-jetbrains text-slate-500 whitespace-nowrap">{r.model?.replace('gemini-', 'g-').replace('-flash', '-fl')}</td>
                          <td className="px-4 py-2.5 font-jetbrains text-slate-500 text-right">{r.tokens_prompt != null ? fmtTokens(r.tokens_prompt) : '—'}</td>
                          <td className="px-4 py-2.5 font-jetbrains text-slate-500 text-right">{r.tokens_output != null ? fmtTokens(r.tokens_output) : '—'}</td>
                          <td className="px-4 py-2.5 font-jetbrains font-semibold text-right" style={{ color: r.cost_usd > 0.01 ? '#dc2626' : '#059669' }}>
                            {r.cost_usd != null ? fmtCost(r.cost_usd) : '—'}
                          </td>
                          <td className="px-4 py-2.5 font-jetbrains text-slate-400 text-right">{r.duration_ms != null ? `${r.duration_ms}` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
