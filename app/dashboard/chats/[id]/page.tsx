"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  User,
  Bot,
  Clock,
  MessageSquare,
  Building2,
  Calendar,
  Globe,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  guest_session_id: string;
  property_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  message_count: number;
  session_duration_seconds: number;
  intent_summary: string[];
  unanswered_count: number;
  language?: string;
  // joined
  property_name?: string;
}

const INTENT_LABELS: Record<string, string> = {
  wifi: "WiFi",
  checkin: "Check-in",
  recommendation_food: "Restaurantes",
  recommendation_activity: "Actividades",
  rules: "Normas",
  appliance_usage: "Electrodomésticos",
  emergency: "Emergencia",
  manual_request: "Manuales",
  general: "General",
  property_info: "Info Propiedad",
  standard: "Estándar",
};

export default function ChatTranscriptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (!profile?.tenant_id || !id) return;
      setIsLoading(true);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("guest_chats")
        .select(`*, properties(name)`)
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (error || !data) {
        setError("Conversación no encontrada o sin acceso.");
      } else {
        setChat({
          ...data,
          property_name: (data.properties as any)?.name || "Propiedad",
        });
      }
      setIsLoading(false);
    };

    fetchChat();
  }, [id, profile?.tenant_id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen -m-4 p-4 md:-m-8 md:p-8 bg-curator-mint/10 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button skeleton */}
          <div className="h-8 w-32 bg-white rounded-xl animate-pulse" />
          {/* Header skeleton */}
          <div className="h-28 bg-white rounded-2xl animate-pulse" />
          {/* Messages skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  i % 2 === 0 ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "h-14 rounded-2xl animate-pulse bg-white",
                    i % 2 === 0 ? "w-2/3" : "w-1/2"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !chat) {
    return (
      <div className="min-h-screen -m-4 p-4 md:-m-8 md:p-8 bg-curator-mint/10 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="font-bold text-curator-on-surface font-manrope">{error}</p>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-curator-teal font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  const messages: Message[] = Array.isArray(chat.messages) ? chat.messages : [];
  const durationMin = Math.floor((chat.session_duration_seconds || 0) / 60);
  const durationSec = (chat.session_duration_seconds || 0) % 60;
  const hasUnanswered = (chat.unanswered_count || 0) > 0;

  return (
    <div className="min-h-screen -m-4 p-4 md:-m-8 md:p-8 bg-curator-mint/10 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Back button ────────────────────────────────────────────────── */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-curator-teal/60 hover:text-curator-teal font-bold text-[10px] uppercase tracking-widest h-8 px-3 rounded-xl hover:bg-white -ml-1"
        >
          <ArrowLeft className="w-3 h-3 mr-1.5" /> Analíticas
        </Button>

        {/* ── Session header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: identity */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-curator-mint flex items-center justify-center font-black text-curator-primary text-xs uppercase shrink-0">
                {chat.guest_session_id?.slice(0, 2) || "G"}
              </div>
              <div>
                <h1 className="font-extrabold text-base text-curator-on-surface font-manrope tracking-tight leading-none">
                  Session {chat.guest_session_id?.slice(0, 8)}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-curator-teal/50 uppercase tracking-wider">
                    <Building2 className="w-3 h-3" />
                    {chat.property_name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-curator-teal/50 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(chat.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                  {chat.language && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-curator-teal/50 uppercase tracking-wider">
                      <Globe className="w-3 h-3" />
                      {chat.language.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: status badge + unanswered warning */}
            <div className="flex items-center gap-2 shrink-0">
              {hasUnanswered && (
                <Badge className="bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none">
                  {chat.unanswered_count} sin respuesta
                </Badge>
              )}
              <Badge className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none">
                Resolved
              </Badge>
            </div>
          </div>

          {/* ── Stats row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-curator-teal/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-base font-extrabold text-curator-on-surface font-manrope leading-none">
                  {chat.message_count || messages.length}
                </p>
                <p className="text-[8px] font-bold text-curator-on-surface/40 uppercase tracking-widest mt-0.5">
                  Mensajes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-extrabold text-curator-on-surface font-manrope leading-none">
                  {durationMin}m {durationSec}s
                </p>
                <p className="text-[8px] font-bold text-curator-on-surface/40 uppercase tracking-widest mt-0.5">
                  Duración
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-curator-mint flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-curator-primary" />
              </div>
              <div>
                <p className="text-base font-extrabold text-curator-on-surface font-manrope leading-none truncate">
                  {chat.intent_summary?.length
                    ? (INTENT_LABELS[chat.intent_summary[0]] || chat.intent_summary[0])
                    : "—"}
                </p>
                <p className="text-[8px] font-bold text-curator-on-surface/40 uppercase tracking-widest mt-0.5">
                  Intent principal
                </p>
              </div>
            </div>
          </div>

          {/* ── Intent tags ─────────────────────────────────────────────── */}
          {chat.intent_summary?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {chat.intent_summary.map((intent) => (
                <span
                  key={intent}
                  className="px-2.5 py-1 bg-curator-mint/60 text-curator-primary text-[8px] font-black uppercase tracking-widest rounded-full"
                >
                  {INTENT_LABELS[intent] || intent}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Transcript ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-curator-teal/5 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-curator-teal/50 font-manrope">
              Transcript completo
            </h2>
            <span className="text-[9px] font-bold text-curator-teal/30 uppercase tracking-widest">
              {Math.ceil(messages.length / 2)} interacciones
            </span>
          </div>

          <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-xs text-curator-teal/40 font-manrope italic">
                  No hay mensajes en esta sesión.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300",
                      isUser ? "justify-start" : "justify-start"
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        isUser
                          ? "bg-stone-100 text-stone-500"
                          : "bg-curator-mint text-curator-primary"
                      )}
                    >
                      {isUser ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="flex-1 max-w-[85%] space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            isUser ? "text-stone-400" : "text-curator-primary/60"
                          )}
                        >
                          {isUser ? "Huésped" : "Guide"}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[8px] text-curator-teal/25 font-bold">
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed font-manrope",
                          isUser
                            ? "bg-stone-50 text-stone-700 rounded-tl-sm"
                            : "bg-curator-mint/40 text-curator-on-surface rounded-tl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
