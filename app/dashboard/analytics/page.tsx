"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { UnansweredQuestionsList } from "@/components/dashboard/analytics/UnansweredQuestionsList";
import { RecentConversations } from "@/components/dashboard/analytics/RecentConversations";
import { IaCostChart } from "@/components/dashboard/analytics/IaCostChart";
import { GuestInsightsBar } from "@/components/dashboard/analytics/GuestInsightsBar";
import { IaDetailLog } from "@/components/dashboard/analytics/IaDetailLog";
import { ExecutiveSummaryCard } from "@/components/dashboard/analytics/ExecutiveSummaryCard";
import { GuestSlideOver } from "@/components/dashboard/analytics/GuestSlideOver";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Zap, Calendar as CalendarIcon, Filter, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { profile } = useUserProfile();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("30");
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Slide-over state
  const [selectedGuest, setSelectedGuest] = useState<{ id: string; name: string; property: string } | null>(null);

  // Chat KPIs
  const [totalConversations, setTotalConversations] = useState({ current: 0, trend: 0 });
  const [answeredRate, setAnsweredRate] = useState({ current: 0, trend: 0 });

  // IA KPIs
  const [iaCostMonth, setIaCostMonth] = useState(0);
  const [iaTokensMonth, setIaTokensMonth] = useState(0);

  // Chart data
  const [dailyIaData, setDailyIaData] = useState<any[]>([]);
  const [opIaData, setOpIaData] = useState<any[]>([]);
  const [iaLogEntries, setIaLogEntries] = useState<any[]>([]);

  // Section + conversations
  const [sectionUsage, setSectionUsage] = useState<any[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile?.tenant_id) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Properties
      const { data: props } = await supabase
        .from("properties").select("id, name")
        .eq("tenant_id", profile.tenant_id);
      setProperties(props || []);
      const propMap = new Map(props?.map(p => [p.id, p.name]));

      const now = new Date();
      const days = parseInt(dateFilter);
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - days);
      const sixtyDaysAgo  = new Date(); sixtyDaysAgo.setDate(now.getDate() - (days * 2));

      // ── Chat analytics ────────────────────────────────────────────────────
      let chatQuery = supabase.from("guest_chats").select("*")
        .eq("tenant_id", profile.tenant_id)
        .gte("created_at", sixtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      if (selectedPropertyId !== "all") chatQuery = chatQuery.eq("property_id", selectedPropertyId);
      const { data: allChats } = await chatQuery;

      if (allChats) {
        const curr = allChats.filter(c => new Date(c.created_at) >= thirtyDaysAgo);
        const prev = allChats.filter(c => new Date(c.created_at) < thirtyDaysAgo);

        const trend = prev.length > 0 ? Math.round(((curr.length - prev.length) / prev.length) * 100) : 0;
        setTotalConversations({ current: curr.length, trend });

        const calcRate = (c: any[]) => c.length === 0 ? 0
          : Math.round((c.filter(x => (x.unanswered_count || 0) === 0).length / c.length) * 100);
        setAnsweredRate({ current: calcRate(curr), trend: calcRate(curr) - calcRate(prev) });

        setRecentChats(curr.slice(0, 20).map(c => ({
          ...c,
          property_name: propMap.get(c.property_id) || "Propiedad",
          first_question: Array.isArray(c.messages) ? c.messages.find((m: any) => m.role === "user" || m.role === "guest")?.content || "" : "",
        })));
      }

      // ── Unanswered questions ──────────────────────────────────────────────
      let unQuery = supabase.from("unanswered_questions").select("*")
        .eq("tenant_id", profile.tenant_id)
        .gte("asked_at", thirtyDaysAgo.toISOString())
        .order("times_asked", { ascending: false }).limit(5);
      if (selectedPropertyId !== "all") unQuery = unQuery.eq("property_id", selectedPropertyId);
      const { data: unanswered } = await unQuery;
      setUnansweredQuestions(unanswered || []);

      // ── Section views ─────────────────────────────────────────────────────
      let viewQuery = supabase.from("guide_section_views")
        .select("section, id").gte("viewed_at", thirtyDaysAgo.toISOString());
      if (selectedPropertyId === "all") {
        const propIds = props?.map(p => p.id) || [];
        if (propIds.length > 0) viewQuery = viewQuery.in("property_id", propIds);
      } else {
        viewQuery = viewQuery.eq("property_id", selectedPropertyId);
      }
      const { data: views } = await viewQuery;
      if (views) {
        const counts: Record<string, number> = {};
        views.forEach(v => { counts[v.section] = (counts[v.section] || 0) + 1; });
        setSectionUsage(Object.entries(counts).map(([section, count]) => ({ section, count })).sort((a, b) => b.count - a.count));
      }

      // ── IA usage ─────────────────────────────────────────────────────────
      let iaQuery = supabase.from("ai_usage_log")
        .select("id, created_at, operation, model, tokens_prompt, tokens_output, tokens_total, cost_usd, duration_ms, is_error")
        .eq("tenant_id", profile.tenant_id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      if (selectedPropertyId !== "all") iaQuery = iaQuery.eq("property_id", selectedPropertyId);
      const { data: iaRows } = await iaQuery;

      if (iaRows) {
        setIaCostMonth(iaRows.reduce((acc, r) => acc + (r.cost_usd || 0), 0));
        setIaTokensMonth(iaRows.reduce((acc, r) => acc + (r.tokens_total || 0), 0));
        setIaLogEntries(iaRows.slice(0, 20));

        const byDay: Record<string, { cost: number; tokens: number; calls: number }> = {};
        iaRows.forEach(r => {
          const day = new Date(r.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
          if (!byDay[day]) byDay[day] = { cost: 0, tokens: 0, calls: 0 };
          byDay[day].cost   += r.cost_usd    || 0;
          byDay[day].tokens += r.tokens_total || 0;
          byDay[day].calls  += 1;
        });
        const daysArr: any[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
          daysArr.push({ day: key, ...(byDay[key] || { cost: 0, tokens: 0, calls: 0 }) });
        }
        setDailyIaData(daysArr);

        const byOp: Record<string, { calls: number; cost: number }> = {};
        iaRows.forEach(r => {
          if (!byOp[r.operation]) byOp[r.operation] = { calls: 0, cost: 0 };
          byOp[r.operation].calls += 1;
          byOp[r.operation].cost  += r.cost_usd || 0;
        });
        setOpIaData(Object.entries(byOp).map(([operation, { calls, cost }]) => ({ operation, calls, cost })).sort((a, b) => b.cost - a.cost));
      }

    } catch (err: any) {
      console.error("[ANALYTICS] Error:", err.message);
      toast.error("Error al cargar las analíticas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.tenant_id) fetchData();
  }, [profile?.tenant_id, selectedPropertyId, dateFilter]);

  const activePropName = selectedPropertyId === "all"
    ? "Todas las propiedades"
    : properties.find(p => p.id === selectedPropertyId)?.name || "Propiedad";

  const fmtTokens = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
    n >= 1_000     ? `${(n / 1_000).toFixed(0)}K` : String(n);

  return (
    <div className="min-h-screen -m-8 p-8 bg-[#fbf8fe] font-sans">
      <div className="max-w-[1440px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Inteligencia Operativa</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#000d37] font-manrope">
              Analíticas · <span className="text-blue-600">{activePropName}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] uppercase tracking-widest text-slate-700 focus:ring-0">
                <SelectValue placeholder="Propiedad" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-slate-100">
                <SelectItem value="all" className="font-bold text-[11px] uppercase tracking-widest">Todas</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-bold text-[11px] uppercase tracking-widest text-slate-600">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border border-slate-100 font-bold text-[11px] uppercase tracking-widest text-slate-500 focus:ring-0">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{dateFilter === "7" ? "7 días" : dateFilter === "30" ? "30 días" : "90 días"}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-slate-100">
                <SelectItem value="7" className="font-bold text-[11px] uppercase tracking-widest">7 días</SelectItem>
                <SelectItem value="30" className="font-bold text-[11px] uppercase tracking-widest">30 días</SelectItem>
                <SelectItem value="90" className="font-bold text-[11px] uppercase tracking-widest">90 días</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-slate-100 mx-1" />

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* ── Row 1: 4 KPIs ── */}
        <ExecutiveSummaryCard
          totalConversations={totalConversations}
          answeredRate={answeredRate}
          iaCost={{ current: iaCostMonth, label: "Este Mes" }}
          iaTokens={{ current: iaTokensMonth, label: fmtTokens(iaTokensMonth) }}
          isLoading={isLoading}
        />

        {/* ── Row 2: Gráfico IA (2/3) + Lo que buscan (1/3) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IaCostChart
              dailyData={dailyIaData}
              opData={opIaData}
              isLoading={isLoading}
            />
          </div>
          <div>
            <GuestInsightsBar
              data={sectionUsage}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* ── Row 3: Gaps ── */}
        <UnansweredQuestionsList
          questions={unansweredQuestions}
          propertyId={selectedPropertyId !== "all" ? selectedPropertyId : properties[0]?.id}
          isLoading={isLoading}
        />

        {/* ── Row 4: Conversaciones (1/2) + Log IA (1/2) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#000d37] font-manrope">Conversaciones Recientes</h2>
              <Link 
                href="/dashboard/analytics/links"
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest"
              >
                Uso por huésped <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <RecentConversations
              conversations={recentChats}
              isLoading={isLoading}
              onSelectGuest={(id, name, property) => setSelectedGuest({ id, name, property })}
            />
          </div>
          <IaDetailLog
            entries={iaLogEntries}
            isLoading={isLoading}
          />
        </section>

        {/* ── Detailed Analytics Link ── */}
        <div className="flex justify-center pt-4">
          <Link
            href="/dashboard/analytics/ai-costs"
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/30 transition-all shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Ver Desglose Completo de Costes IA
          </Link>
        </div>

      </div>

      {/* Guest Slide-over */}
      <GuestSlideOver
        isOpen={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        guestId={selectedGuest?.id || null}
        guestName={selectedGuest?.name || null}
        propertyName={selectedGuest?.property || null}
      />
    </div>
  );
}
