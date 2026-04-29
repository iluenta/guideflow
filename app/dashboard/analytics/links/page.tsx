"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { 
  Eye, 
  Clock, 
  Smartphone, 
  Globe, 
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Calendar,
  MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

// ── Sub-componente para el desglose de secciones ──────────────────────────────

function SectionBreakdown({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guide_section_views")
        .select("section, viewed_at, time_spent_seconds")
        .eq("access_token", token);
      
      if (!error && data) {
        // Agrupar por sección
        const agg: Record<string, { count: number; time: number }> = {};
        data.forEach(v => {
          if (!agg[v.section]) agg[v.section] = { count: 0, time: 0 };
          agg[v.section].count++;
          agg[v.section].time += (v.time_spent_seconds || 0);
        });
        setSections(Object.entries(agg).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.count - a.count));
      }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return <div className="py-4 space-y-2"><div className="h-4 bg-slate-50 animate-pulse rounded w-1/2" /><div className="h-4 bg-slate-50 animate-pulse rounded w-3/4" /></div>;

  return (
    <div className="mt-6 space-y-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secciones Visitadas</p>
      <div className="space-y-1">
        {sections.map((s, i) => (
          <div key={i} className="flex items-center group py-1.5 border-b border-slate-50 last:border-0">
            <span className="flex-1 text-sm text-slate-600 font-medium capitalize">{s.name.replace('-', ' ')}</span>
            <div className="flex-1 h-1 bg-slate-50 rounded-full mx-8 overflow-hidden">
               <div className="h-full bg-slate-100 rounded-full" style={{ width: `${Math.min(s.count * 10, 100)}%` }} />
            </div>
            <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400">
              <span className="w-16 text-right">{s.count} {s.count === 1 ? 'vista' : 'vistas'}</span>
              <span className="w-16 text-right text-slate-300">{s.time > 0 ? `${Math.floor(s.time/60)}m ${s.time%60}s` : '--'}</span>
            </div>
          </div>
        ))}
        {sections.length === 0 && <p className="text-xs text-slate-300">Sin vistas registradas todavía</p>}
      </div>
    </div>
  );
}

// ── Item de la lista (Accordion) ─────────────────────────────────────────────

function LinkItem({ link }: { link: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const lastAccess = link.last_seen_at ? new Date(link.last_seen_at) : null;
  const firstAccess = link.first_opened_at ? new Date(link.first_opened_at) : null;
  
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 mb-4",
      isExpanded ? "ring-2 ring-blue-100 border-blue-100" : "hover:border-slate-200"
    )}>
      <div 
        className="p-5 flex items-center gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status Dot */}
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          link.open_count > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-200"
        )} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#000d37] truncate">{link.guest_name}</span>
            <span className="text-[11px] text-slate-400">· {link.properties?.name}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {format(new Date(link.created_at), "dd MMM", { locale: es })} – {link.valid_until ? format(new Date(link.valid_until), "dd MMM", { locale: es }) : "S/F"}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="hidden md:flex items-center gap-12 mr-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Primera apertura</p>
            <p className="text-[11px] font-bold text-slate-600">
              {firstAccess ? `hace alrededor de ${formatDistanceToNow(firstAccess, { locale: es })}` : 'Nunca'}
            </p>
          </div>
          <div className="text-center w-16">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Aperturas</p>
            <p className="text-sm font-black text-[#000d37]">{link.open_count || 0}</p>
          </div>
          <div className="text-center w-16">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Secciones</p>
            <p className="text-sm font-black text-[#000d37]">{link.sections_viewed_count || 0}</p>
          </div>
        </div>

        <button className="text-slate-300 hover:text-slate-500 transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-6 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span>Primera: {firstAccess ? format(firstAccess, "dd MMM yyyy, HH:mm", { locale: es }) : '--'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              <span>Última: {lastAccess ? format(lastAccess, "dd MMM yyyy, HH:mm", { locale: es }) : '--'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-slate-300" />
              <span className="truncate">{link.user_agent_first || 'Desconocido'}</span>
            </div>
          </div>

          <SectionBreakdown token={link.access_token} />
        </div>
      )}
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────

export default function LinkAnalyticsPage() {
  const { profile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "opened" | "unopened">("all");

  useEffect(() => {
    if (profile?.tenant_id) fetchLinks();
  }, [profile?.tenant_id]);

  const fetchLinks = async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("guest_access_tokens")
        .select(`
          *,
          properties (name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Traer counts de secciones ÚNICAS para cada link
      const linksWithCounts = await Promise.all((data || []).map(async (link) => {
        const { data: sectionsData } = await supabase
          .from("guide_section_views")
          .select("section")
          .eq("access_token", link.access_token);
        
        const uniqueSections = new Set(sectionsData?.map(s => s.section)).size;
        return { ...link, sections_viewed_count: uniqueSections };
      }));

      setLinks(linksWithCounts);
    } catch (err) {
      console.error("Error fetching link analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLinks = links.filter(l => {
    if (filter === "opened") return l.open_count > 0;
    if (filter === "unopened") return l.open_count === 0;
    return true;
  });

  return (
    <div className="min-h-screen -m-8 p-8 bg-[#fbf8fe] font-sans">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Top Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter("all")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm",
              filter === "all" ? "bg-[#000d37] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter("opened")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm",
              filter === "opened" ? "bg-[#000d37] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            Abiertos
          </button>
          <button 
            onClick={() => setFilter("unopened")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm",
              filter === "unopened" ? "bg-[#000d37] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            No abiertos
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-sm" />
            ))
          ) : filteredLinks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-300 border border-slate-100">
              No hay enlaces que coincidan con el filtro
            </div>
          ) : (
            filteredLinks.map((link) => (
              <LinkItem key={link.id} link={link} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
