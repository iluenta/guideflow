"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecentConversationsProps {
  conversations: any[];
  isLoading?: boolean;
}

const getLanguageFlag = (langCode?: string) => {
  const code = langCode?.toLowerCase().slice(0, 2);
  switch (code) {
    case 'es': return '🇪🇸';
    case 'en': return '🇬🇧';
    case 'fr': return '🇫🇷';
    case 'de': return '🇩🇪';
    case 'it': return '🇮🇹';
    case 'pt': return '🇵🇹';
    default: return '🌐';
  }
};

const getLanguageName = (langCode?: string) => {
  const code = langCode?.toLowerCase().slice(0, 2);
  switch (code) {
    case 'es': return 'Español';
    case 'en': return 'Inglés';
    case 'fr': return 'Francés';
    case 'de': return 'Alemán';
    case 'it': return 'Italiano';
    case 'pt': return 'Portugués';
    default: return langCode || 'Desconocido';
  }
};

export function RecentConversations({ conversations, isLoading }: RecentConversationsProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "flagged" | "archived">("recent");

  const filteredConversations = conversations.filter(chat => {
    if (activeTab === "recent") return true;
    if (activeTab === "flagged") return (chat.unanswered_count || 0) > 0 || chat.status === "flagged";
    if (activeTab === "archived") return chat.status === "archived";
    return true;
  });

  const flaggedCount = conversations.filter(c => (c.unanswered_count || 0) > 0 || c.status === "flagged").length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100 pb-0 px-2">
        <button 
          onClick={() => setActiveTab("recent")}
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest pb-3 -mb-px transition-colors",
            activeTab === "recent" ? "text-curator-primary border-b-2 border-curator-primary" : "text-slate-400 hover:text-slate-700"
          )}
        >
          Recientes
        </button>
        <button 
          onClick={() => setActiveTab("flagged")}
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest pb-3 -mb-px transition-colors flex items-center gap-1.5",
            activeTab === "flagged" ? "text-amber-600 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-700"
          )}
        >
          Requieren atención
          {flaggedCount > 0 && (
            <span className="bg-amber-100 text-amber-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">
              {flaggedCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("archived")}
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest pb-3 -mb-px transition-colors",
            activeTab === "archived" ? "text-slate-800 border-b-2 border-slate-800" : "text-slate-400 hover:text-slate-700"
          )}
        >
          Archivadas
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3 pt-1">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl bg-white h-32 animate-pulse" />
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((chat) => {
            const hasGaps = (chat.unanswered_count || 0) > 0;
            const isResolved = !hasGaps;

            return (
              <Card
                key={chat.id}
                className="border-none shadow-sm rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-md group"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Metadatos */}
                  <div className="flex gap-4 items-start sm:w-1/3">
                    <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        isResolved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                    )} />
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <h4 className="font-bold text-[13px] text-slate-800 font-manrope leading-none">
                          Huésped
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                        {new Date(chat.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {getLanguageFlag(chat.language)} {getLanguageName(chat.language)}
                      </p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                        {chat.property_name}
                      </p>
                    </div>
                  </div>

                  {/* Center: Previews */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:w-1/2 flex flex-col justify-center">
                    <div className="flex gap-2">
                       <span className="text-[10px] text-slate-400 shrink-0">H:</span>
                       <p className="text-[12px] font-manrope text-slate-700 leading-snug italic truncate">
                         "{chat.first_question || 'Inició sesión'}"
                       </p>
                    </div>
                  </div>

                  {/* Right: Acciones */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:w-1/6 gap-2">
                    <Badge
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                        isResolved
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      )}
                    >
                      {isResolved ? "COMPLETA" : "ATENCIÓN"}
                    </Badge>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-bold text-curator-primary hover:bg-curator-mint/20 rounded-lg h-7 mt-auto"
                    >
                      <Link href={`/dashboard/chats/${chat.id}`} className="flex items-center">
                        Transcripción <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="py-16 text-center space-y-4 bg-white rounded-2xl shadow-sm border border-slate-50">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs text-slate-500 font-manrope font-medium max-w-xs mx-auto">
              {activeTab === "recent" 
                ? "Comparte el link de tu guía con tus huéspedes para empezar a ver conversaciones aquí."
                : "No hay conversaciones que requieran tu atención."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}