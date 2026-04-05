"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { ExecutiveSummaryCard } from "@/components/dashboard/analytics/ExecutiveSummaryCard";
import { SessionMetrics, IntentDistributionChart } from "@/components/dashboard/analytics/ChatAnalytics";
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
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const { profile } = useUserProfile();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalConversations: 0,
    languagesCount: 1,
    timeSaved: "~0h",
    callsAvoided: 0,
    avgMessages: 0,
    avgDuration: 0,
    totalResolved: 0,
    intentDistribution: [] as { intent: string; count: number }[],
    sectionUsage: [] as { section: string; count: number }[],
    unansweredQuestions: [] as any[],
    recentChats: [] as any[],
  });

  const fetchData = async () => {
    if (!profile?.tenant_id) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      // 1. Properties
      const { data: props } = await supabase
        .from("properties")
        .select("id, name")
        .eq("tenant_id", profile.tenant_id);
      setProperties(props || []);

      // 2. Guest chats
      let chatQuery = supabase
        .from("guest_chats")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false });
      if (selectedPropertyId !== "all") {
        chatQuery = chatQuery.eq("property_id", selectedPropertyId);
      }
      const { data: chats } = await chatQuery;

      if (chats) {
        const total = chats.length;
        const languages = new Set(chats.map((c) => c.language).filter(Boolean));
        const languagesCount = languages.size || 1;

        // Tiempo ahorrado: ~12 min por conversación evitada al propietario
        const totalMinutesSaved = total * 12;
        const hoursSaved = Math.floor(totalMinutesSaved / 60);
        const remainingMins = totalMinutesSaved % 60;
        const timeSaved = hoursSaved > 0
          ? `~${hoursSaved}h${remainingMins > 0 ? ` ${remainingMins}m` : ""}`
          : `~${remainingMins}m`;

        // Llamadas evitadas: 25% de las conversaciones hubieran sido llamadas
        const callsAvoided = Math.round(total * 0.25);

        // Métricas de sesión
        const avgMessages = total > 0
          ? chats.reduce((acc, c) => acc + (c.message_count || 0), 0) / total
          : 0;
        const avgDuration = total > 0
          ? chats.reduce((acc, c) => acc + (c.session_duration_seconds || 0), 0) / total
          : 0;

        // Intent distribution
        const intentCounts: Record<string, number> = {};
        chats.forEach((c) => {
          if (Array.isArray(c.intent_summary)) {
            c.intent_summary.forEach((intent: string) => {
              intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            });
          }
        });
        const intentDistribution = Object.entries(intentCounts)
          .map(([intent, count]) => ({ intent, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Tasa de resolución: sesiones con ≥2 mensajes = conversación completada
        const totalResolved = total > 0
          ? Math.round((chats.filter((c) => (c.message_count || 0) >= 2).length / total) * 100)
          : 0;

        // Últimas 5 conversaciones enriquecidas para la lista
        const propMap = new Map(props?.map((p) => [p.id, p.name]));
        const recentChats = chats.slice(0, 5).map((c) => {
          const msgs = Array.isArray(c.messages) ? c.messages : [];
          const firstQuestion =
            msgs.find((m: any) => m.role === "user" || m.role === "guest")?.content || "...";
          const lastAiResponse =
            [...msgs].reverse().find((m: any) => m.role === "assistant" || m.role === "guide")?.content || "...";
          return {
            ...c,
            property_name: propMap.get(c.property_id) || "Property",
            first_question: firstQuestion,
            last_ai_response: lastAiResponse,
          };
        });

        setStats((prev) => ({
          ...prev,
          totalConversations: total,
          languagesCount,
          timeSaved,
          callsAvoided,
          avgMessages,
          avgDuration,
          totalResolved,
          intentDistribution,
          recentChats,
        }));
      }

      // 3. Preguntas sin respuesta
      let unQuery = supabase
        .from("unanswered_questions")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("times_asked", { ascending: false })
        .limit(5);
      if (selectedPropertyId !== "all")
        unQuery = unQuery.eq("property_id", selectedPropertyId);
      const { data: unanswered } = await unQuery;
      setStats((prev) => ({ ...prev, unansweredQuestions: unanswered || [] }));

      // 4. Vistas de secciones de la guía
      let viewQuery = supabase.from("guide_section_views").select("section, id");
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
        const sectionUsage = Object.entries(sectionCounts)
          .map(([section, count]) => ({ section, count }))
          .sort((a, b) => b.count - a.count);
        setStats((prev) => ({ ...prev, sectionUsage }));
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
  }, [profile?.tenant_id, selectedPropertyId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12 min-h-screen -m-4 p-4 md:-m-8 md:p-8 bg-curator-mint/10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <BarChart className="w-4 h-4 text-curator-primary" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-curator-teal/50 font-manrope">
                Guide Intelligence
              </h4>
              <Badge className="bg-curator-primary/10 text-curator-primary border-none rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-curator-primary animate-pulse" />
                Live Curator
              </Badge>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-curator-on-surface font-manrope tracking-tighter leading-none">
            This Month's{" "}
            <span className="text-curator-teal italic font-light tracking-normal">Impact</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white/40 p-1.5 rounded-xl backdrop-blur-md">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg bg-white shadow-sm border-none font-bold text-[9px] uppercase tracking-[0.15em] text-curator-teal">
              <SelectValue placeholder="All Estates" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border-none">
              <SelectItem value="all" className="font-bold text-[9px] uppercase tracking-widest">
                All Estates
              </SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-bold text-[9px] uppercase tracking-widest">
                  {p.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-lg text-curator-teal hover:bg-white h-9 px-4 font-bold text-[9px] uppercase tracking-widest"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <ExecutiveSummaryCard
        totalConversations={stats.totalConversations}
        timeSaved={stats.timeSaved}
        callsAvoided={stats.callsAvoided}
        languagesCount={stats.languagesCount}
        isLoading={isLoading}
      />

      {/* ── Layout principal ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* Columna principal */}
        <div className="xl:col-span-8 space-y-6">
          <RecentConversations conversations={stats.recentChats} isLoading={isLoading} />

          <IntentDistributionChart
            intentDistribution={stats.intentDistribution}
            isLoading={isLoading}
          />

          {/* Banner */}
          <div className="bg-curator-teal rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-lg text-center xl:text-left">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-100">
                    Intelligence Roadmap
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold font-manrope tracking-tighter leading-tight italic">
                  Anticipating your guest needs before they arise.
                </h3>
              </div>
              <Button
                variant="outline"
                className="rounded-2xl border-white/20 text-white hover:bg-white hover:text-curator-teal h-12 px-8 font-bold text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105"
              >
                Insights <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <SectionUsageChart data={stats.sectionUsage} isLoading={isLoading} />

          <UnansweredQuestionsList
            questions={stats.unansweredQuestions}
            propertyId={selectedPropertyId !== "all" ? selectedPropertyId : properties[0]?.id}
            isLoading={isLoading}
          />

          <SessionMetrics
            avgMessages={stats.avgMessages}
            avgDuration={stats.avgDuration}
            totalResolved={stats.totalResolved}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}