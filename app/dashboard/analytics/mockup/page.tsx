"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { StatCardsMockup } from "@/components/dashboard/analytics/mockup/StatCardsMockup";
import { MockupConversationList } from "@/components/dashboard/analytics/mockup/MockupConversationList";
import { SidebarMockup } from "@/components/dashboard/analytics/mockup/SidebarMockup";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MockupPage() {
  const { profile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversations: 0,
    timeSaved: "~0h",
    callsAvoided: 0,
    languages: 1
  });
  const [conversations, setConversations] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile?.tenant_id) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch Conversations Stats (Using existing columns only)
      const { data: chats, error: chatError } = await supabase
        .from('guest_chats')
        .select(`
          id, 
          created_at, 
          language, 
          messages,
          properties (
            name
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (chatError) throw chatError;

      if (chats) {
        const total = chats.length;
        const languagesCount = new Set(chats.map(c => c.language).filter(Boolean)).size || 1;
        
        // Calculated Metrics
        const totalMinutes = total * 10;
        const hoursSaved = Math.floor(totalMinutes / 60);
        const remainingMins = totalMinutes % 60;
        const timeStr = hoursSaved > 0 
          ? `~${hoursSaved}h${remainingMins > 0 ? ` ${remainingMins}m` : ''}` 
          : `~${remainingMins}m`;

        const avoided = Math.round(total * 0.25);

        setStats({
          totalConversations: total,
          timeSaved: timeStr,
          callsAvoided: avoided,
          languages: languagesCount
        });

        // Format conversations extracting messages from JSONB array
        const formattedChats = chats.map((c: any) => {
          const msgs = Array.isArray(c.messages) ? c.messages : [];
          // Extraction from {role, content, timestamp} structure
          const firstUserMsg = msgs.find((m: any) => m.role === 'user' || m.role === 'guest')?.content || "Sin mensaje del huésped";
          const lastGuideMsg = [...msgs].reverse().find((m: any) => m.role === 'assistant' || m.role === 'guide')?.content || "Esperando respuesta...";

          return {
            id: c.id,
            property: c.properties?.name || "Propiedad",
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            guest: firstUserMsg,
            guide: lastGuideMsg,
            isFlagged: false, // Default since column missing
            isArchived: false, // Default since column missing
            status: "resuelto"
          };
        });

        setConversations(formattedChats);
      }
    } catch (err: any) {
      console.error('[ANALYTICS] Sync Error:', err.message);
      toast.error("Error al sincronizar datos reales");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.tenant_id) fetchData();
  }, [profile?.tenant_id]);

  const currentMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="space-y-10 animate-in fade-in duration-700 bg-[#F8FAF9] -m-8 p-12 min-h-screen">
      {/* Header Section from Image 2 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.45em] text-[#191C1C]/30 font-manrope">Resumen Ejecutivo</h4>
          <h1 className="text-4xl font-[800] text-[#124340] font-manrope tracking-tighter leading-none">
            Impacto de este Mes
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-[#124340] text-white border-none rounded-full px-6 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-[#124340]/20">
            {currentMonth}
          </Badge>
        </div>
      </div>

      {/* KPI Cards (DYNAMIC) */}
      <StatCardsMockup stats={stats} isLoading={isLoading} />

      {/* Core Split Layout from Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-2">
        
        {/* Main Content (Chats) */}
        <div className="lg:col-span-8">
            <MockupConversationList conversations={conversations} isLoading={isLoading} />
        </div>

        {/* Sidebar (Insights) */}
        <div className="lg:col-span-4 space-y-10">
            <SidebarMockup />
        </div>
      </div>
    </div>
  );
}
