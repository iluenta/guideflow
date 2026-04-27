"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { ExecutiveSummaryCard } from "@/components/dashboard/analytics/ExecutiveSummaryCard";
import { InteractionMetrics } from "@/components/dashboard/analytics/ChatAnalytics";
import { UnansweredQuestionsList } from "@/components/dashboard/analytics/UnansweredQuestionsList";
import { SectionUsageChart } from "@/components/dashboard/analytics/SectionUsageChart";
import { RecentConversations } from "@/components/dashboard/analytics/RecentConversations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AnalyticsPage() {
  const { profile } = useUserProfile();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [totalConversations, setTotalConversations] = useState({ current: 0, trend: 0 });
  const [answeredRate, setAnsweredRate] = useState({ current: 0, trend: 0 });
  const [unansweredGaps, setUnansweredGaps] = useState({ current: 0, trend: 0 });
  const [languagesCount, setLanguagesCount] = useState(0);

  const [interactionStats, setInteractionStats] = useState({
    avgMessages: 0,
    avgDuration: 0,
    topLanguage: undefined as { language: string; percentage: number } | undefined,
  });

  const [sectionUsage, setSectionUsage] = useState<any[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);

  const fetchMoMData = (currentScore: number, prevScore: number) => {
    if (prevScore === 0) return 0;
    return Math.round(((currentScore - prevScore) / prevScore) * 100);
  };

  const fetchData = async () => {
    if (!profile?.tenant_id) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch Properties
      const { data: props } = await supabase
        .from("properties")
        .select("id, name")
        .eq("tenant_id", profile.tenant_id);
      setProperties(props || []);
      const propMap = new Map(props?.map((p) => [p.id, p.name]));

      // 2. Fetch limit dates (Last 60 days to compare Current 30 vs Prev 30)
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(now.getDate() - 60);

      // 3. Guest chats
      let chatQuery = supabase
        .from("guest_chats")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .gte("created_at", sixtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (selectedPropertyId !== "all") {
        chatQuery = chatQuery.eq("property_id", selectedPropertyId);
      }
      const { data: allChats } = await chatQuery;

      if (allChats) {
        // Split into periods
        const currentChats = allChats.filter((c) => new Date(c.created_at) >= thirtyDaysAgo);
        const prevChats = allChats.filter((c) => new Date(c.created_at) < thirtyDaysAgo);

        // -- Conversaciones Totales
        const currentTotal = currentChats.length;
        const prevTotal = prevChats.length;
        setTotalConversations({ current: currentTotal, trend: fetchMoMData(currentTotal, prevTotal) });

        // -- Tasa de respuesta (resueltas sin gaps)
        const calcAnswered = (chats: any[]) => {
          if (chats.length === 0) return 0;
          const answered = chats.filter((c) => (c.unanswered_count || 0) === 0).length;
          return Math.round((answered / chats.length) * 100);
        };
        const currentRate = calcAnswered(currentChats);
        const prevRate = calcAnswered(prevChats);
        setAnsweredRate({ current: currentRate, trend: currentRate - prevRate }); // absoluto en %

        // -- Preguntas sin respuesta (Gravedad de Gaps)
        const calcGaps = (chats: any[]) => chats.reduce((acc, c) => acc + (c.unanswered_count || 0), 0);
        const currGaps = calcGaps(currentChats);
        const prvsGaps = calcGaps(prevChats);
        setUnansweredGaps({ current: currGaps, trend: fetchMoMData(currGaps, prvsGaps) });

        // -- Idiomas Activos
        const langs = new Set(currentChats.map((c) => c.language).filter(Boolean));
        setLanguagesCount(langs.size);

        // -- Métricas de Interacción
        const avgMessages = currentTotal > 0
          ? currentChats.reduce((acc, c) => acc + (c.message_count || 0), 0) / currentTotal
          : 0;
        const avgDuration = currentTotal > 0
          ? currentChats.reduce((acc, c) => acc + (c.session_duration_seconds || 0), 0) / currentTotal
          : 0;

        const langCounts: Record<string, number> = {};
        currentChats.forEach((c) => {
          if (c.language) {
            langCounts[c.language] = (langCounts[c.language] || 0) + 1;
          }
        });
        const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
        const topLanguage = sortedLangs.length > 0 ? {
          language: sortedLangs[0][0],
          percentage: (sortedLangs[0][1] / currentTotal) * 100
        } : undefined;

        setInteractionStats({ avgMessages, avgDuration, topLanguage });

        // -- Conversaciones Recientes (sólo mostramos del periodo actual)
        const enrichedChats = currentChats.map((c) => {
          const msgs = Array.isArray(c.messages) ? c.messages : [];
          const firstQuestion = msgs.find((m: any) => m.role === "user" || m.role === "guest")?.content || "";
          const lastAiResponse = [...msgs].reverse().find((m: any) => m.role === "assistant" || m.role === "guide")?.content || "";
          return {
            ...c,
            property_name: propMap.get(c.property_id) || "Propiedad",
            first_question: firstQuestion,
            last_ai_response: lastAiResponse,
          };
        });
        setRecentChats(enrichedChats);
      }

      // 4. Unanswered Questions (Gaps directos a BD)
      let unQuery = supabase
        .from("unanswered_questions")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .gte("asked_at", thirtyDaysAgo.toISOString())
        .order("times_asked", { ascending: false })
        .limit(5);
      if (selectedPropertyId !== "all") unQuery = unQuery.eq("property_id", selectedPropertyId);
      
      const { data: unanswered } = await unQuery;
      setUnansweredQuestions(unanswered || []);

      // 5. Section Views
      let viewQuery = supabase
        .from("guide_section_views")
        .select("section, id")
        .gte("viewed_at", thirtyDaysAgo.toISOString());
        
      if (selectedPropertyId === "all") {
        const propIds = props?.map((p) => p.id) || [];
        if (propIds.length > 0) viewQuery = viewQuery.in("property_id", propIds);
      } else {
        viewQuery = viewQuery.eq("property_id", selectedPropertyId);
      }
      
      const { data: views } = await viewQuery;
      if (views) {
        const sectionCounts: Record<string, number> = {};
        views.forEach((v) => {
          sectionCounts[v.section] = (sectionCounts[v.section] || 0) + 1;
        });
        const finalSections = Object.entries(sectionCounts)
          .map(([section, count]) => ({ section, count }))
          .sort((a, b) => b.count - a.count);
        setSectionUsage(finalSections);
      }

    } catch (err: any) {
      console.error("[ANALYTICS] Error:", err.message);
      toast.error("Error al cargar las analíticas operativas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.tenant_id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.tenant_id, selectedPropertyId]);

  const activePropName = selectedPropertyId === "all" 
    ? "Todas las propiedades" 
    : properties.find(p => p.id === selectedPropertyId)?.name || "Propiedad";

  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12 min-h-screen -m-4 p-4 md:-m-8 md:p-8 bg-slate-50">

      {/* ── Header prominent con selector ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-1 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              <BarChart className="w-5 h-5 text-curator-primary" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 font-manrope">
                Vista Operativa
              </h4>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 font-manrope tracking-tight leading-none capitalize">
            Analíticas · <span className="text-curator-primary">{activePropName}</span>
          </h1>
          <p className="text-slate-500 font-medium capitalize">
            Últimos 30 días ({currentMonthName})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] uppercase tracking-widest text-slate-700 focus:ring-0">
              <SelectValue placeholder="Todas las propiedades" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg border-slate-100">
              <SelectItem value="all" className="font-bold text-[11px] uppercase tracking-widest text-slate-700">
                Todas las propiedades
              </SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-bold text-[11px] uppercase tracking-widest text-slate-600">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href="/dashboard/analytics/ai-costs">
            <Button variant="ghost" size="sm"
              className="w-full sm:w-auto rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 h-10 px-4 font-bold text-[10px] uppercase tracking-widest gap-2">
              <Zap className="w-3.5 h-3.5" />
              Consumo IA
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 h-10 px-4 font-bold text-[10px] uppercase tracking-widest"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── KPIs (Las métricas reales) ───────────────────────────────────────── */}
      <ExecutiveSummaryCard
        totalConversations={totalConversations}
        answeredRate={answeredRate}
        unansweredGaps={unansweredGaps}
        languagesCount={languagesCount}
        isLoading={isLoading}
      />

      {/* ── Gaps (La prioridad principal) ────────────────────────────────────── */}
      <div className="w-full">
        <UnansweredQuestionsList
          questions={unansweredQuestions}
          propertyId={selectedPropertyId !== "all" ? selectedPropertyId : properties[0]?.id}
          isLoading={isLoading}
        />
      </div>

      {/* ── Layout Secundario (Conversaciones y Comportamiento) ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pt-4">

        {/* Columna Izquierda: Conversaciones */}
        <div className="xl:col-span-8 space-y-8">
          <RecentConversations 
            conversations={recentChats} 
            isLoading={isLoading} 
          />
        </div>

        {/* Columna Derecha: Insights */}
        <div className="xl:col-span-4 space-y-6">
          <SectionUsageChart 
            data={sectionUsage} 
            isLoading={isLoading} 
          />

          <InteractionMetrics
            avgMessages={interactionStats.avgMessages}
            avgDuration={interactionStats.avgDuration}
            topLanguage={interactionStats.topLanguage}
            isLoading={isLoading}
          />
        </div>

      </div>
    </div>
  );
}