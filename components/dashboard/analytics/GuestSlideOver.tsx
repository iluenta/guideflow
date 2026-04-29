"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, MessageSquare, Map, Clock, Activity, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface GuestSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string | null;
  guestName: string | null;
  propertyName: string | null;
}

export function GuestSlideOver({ isOpen, onClose, guestId, guestName, propertyName }: GuestSlideOverProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && guestId) {
      fetchGuestData();
    }
  }, [isOpen, guestId]);

  const fetchGuestData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      // Fetch session data, views, and chat summary
      // This is a simplified version of what we would fetch
      const { data: views } = await supabase
        .from("guide_section_views")
        .select("*")
        .eq("guest_session_id", guestId)
        .order("viewed_at", { ascending: false });

      setData({
        views: views || [],
        metrics: {
          messages: 0,
          sections: views?.length || 0,
          openings: 1, // Mock
          time: views?.reduce((acc: number, v: any) => acc + (v.time_spent_seconds || 0), 0) || 0
        }
      });
    } catch (err) {
      console.error("Error fetching guest data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className={cn(
          "w-screen max-w-md bg-white shadow-2xl transform transition-transform duration-500 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-4">
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Cerrar
              </button>
              <h2 className="text-2xl font-bold text-[#000d37] font-manrope">{guestName || "Huésped"}</h2>
              <p className="text-sm text-slate-500 font-medium">{propertyName || "Propiedad"}</p>
            </div>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-140px)]">
            {/* Stay info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estancia</p>
                <p className="text-sm font-bold text-slate-700">Oct 12 – Oct 18</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mensajes</p>
                <p className="text-xl font-bold text-[#000d37]">{data?.metrics.messages || 0}</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Secciones</p>
                <p className="text-xl font-bold text-[#000d37]">{data?.metrics.sections || 0}</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aperturas</p>
                <p className="text-xl font-bold text-[#000d37]">{data?.metrics.openings || 0}</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tiempo</p>
                <p className="text-xl font-bold text-[#000d37]">{Math.round((data?.metrics.time || 0) / 60)} min</p>
              </div>
            </div>

            {/* Secciones Visitadas breakdown */}
            <div className="pt-4 border-t border-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Map className="w-3.5 h-3.5" /> Secciones Visitadas
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-xl" />)}
                  </div>
                ) : data?.views.length > 0 ? (
                  (() => {
                    const agg: Record<string, { count: number; time: number }> = {};
                    data.views.forEach((v: any) => {
                      if (!agg[v.section]) agg[v.section] = { count: 0, time: 0 };
                      agg[v.section].count++;
                      agg[v.section].time += (v.time_spent_seconds || 0);
                    });
                    return Object.entries(agg).map(([name, stats]: [string, any], i) => (
                      <div key={i} className="flex items-center group">
                        <span className="flex-1 text-xs text-slate-700 font-bold capitalize">{name.replace('-', ' ')}</span>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                          <span className="bg-slate-50 px-2 py-0.5 rounded-md">{stats.count} {stats.count === 1 ? 'vista' : 'vistas'}</span>
                          <span className="text-slate-300 w-12 text-right">{stats.time > 0 ? `${Math.floor(stats.time/60)}m` : '--'}</span>
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <p className="text-sm text-slate-300 text-center py-4">Sin actividad registrada</p>
                )}
              </div>
            </div>


            {/* AI Intelligence */}
            <div className="pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Intelligence Metrics
              </h3>
              <div className="bg-[#000d37] rounded-2xl p-5 text-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Tokens Utilizados</span>
                  <span className="text-xl font-bold">1,248</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Coste Estimado</span>
                  <span className="text-xl font-bold text-teal-400">$0.0094</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Latencia Media</span>
                  <span className="text-xl font-bold">1.2s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
