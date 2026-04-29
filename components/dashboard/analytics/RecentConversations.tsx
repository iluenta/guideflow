"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RecentConversationsProps {
  conversations: any[];
  isLoading?: boolean;
  onSelectGuest: (guestId: string, guestName: string, propertyName: string) => void;
}


function getInitials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getLanguageFlag(langCode?: string): string {
  const code = langCode?.toLowerCase().slice(0, 2);
  switch (code) {
    case "es": return "🇪🇸";
    case "en": return "🇬🇧";
    case "fr": return "🇫🇷";
    case "de": return "🇩🇪";
    case "it": return "🇮🇹";
    case "pt": return "🇵🇹";
    default:   return "🌐";
  }
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(id: string) {
  const n = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[n];
}

export function RecentConversations({ conversations, isLoading, onSelectGuest }: RecentConversationsProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "flagged">("recent");

  const flaggedCount = conversations.filter(c => (c.unanswered_count || 0) > 0).length;

  const filtered = conversations.filter(c => {
    if (activeTab === "flagged") return (c.unanswered_count || 0) > 0;
    return true;
  }).slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#000d37] font-manrope">Últimas interacciones</h3>
        <Link
          href="/dashboard/analytics/conversations"
          className="text-blue-600 text-xs font-bold hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 px-6">
        <button
          onClick={() => setActiveTab("recent")}
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest py-3 pr-6 -mb-px transition-colors",
            activeTab === "recent"
              ? "text-[#000d37] border-b-2 border-[#000d37]"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          Recientes
        </button>
        <button
          onClick={() => setActiveTab("flagged")}
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest py-3 pr-6 -mb-px transition-colors flex items-center gap-1.5",
            activeTab === "flagged"
              ? "text-amber-600 border-b-2 border-amber-500"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          Escalados
          {flaggedCount > 0 && (
            <span className="bg-amber-100 text-amber-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">
              {flaggedCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 animate-pulse rounded w-1/3" />
                <div className="h-2 bg-slate-50 animate-pulse rounded w-2/3" />
                <div className="h-10 bg-slate-50 animate-pulse rounded-lg" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-300">
            {activeTab === "recent"
              ? "Comparte la guía con tus huéspedes para ver conversaciones aquí."
              : "No hay interacciones que requieran atención."}
          </div>
        ) : (
          filtered.map(chat => {
            const hasGaps = (chat.unanswered_count || 0) > 0;
            const initials = getInitials(chat.guest_name || "H");
            const timeAgo = formatDistanceToNow(new Date(chat.created_at), { locale: es, addSuffix: true });

            return (
              <div
                key={chat.id}
                onClick={() => onSelectGuest(chat.guest_session_id || chat.id, chat.guest_name || "Huésped", chat.property_name)}
                className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-110",
                  avatarColor(chat.id)
                )}>
                  {initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-[#000d37]">
                      {chat.guest_name || "Huésped"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">
                    {getLanguageFlag(chat.language)} {chat.property_name}
                  </p>

                  {/* AI response bubble */}
                  {chat.first_question && (
                    <div className={cn(
                      "border p-2 rounded-lg",
                      hasGaps
                        ? "bg-amber-50 border-amber-100"
                        : "bg-blue-50 border-blue-100"
                    )}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          hasGaps ? "text-amber-600" : "text-blue-600"
                        )}>
                          {hasGaps ? "⚠ Escalado" : "✦ Respuesta IA"}
                        </span>
                      </div>
                      <p className={cn(
                        "text-[11px] leading-relaxed italic line-clamp-2",
                        hasGaps ? "text-amber-900" : "text-blue-900"
                      )}>
                        &ldquo;{chat.first_question}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Status + link */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    hasGaps
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                  )}>
                    {hasGaps ? "Pendiente" : "Resuelto"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGuest(chat.guest_session_id || chat.id, chat.guest_name || "Huésped", chat.property_name);
                    }}
                    className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    Ver <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
