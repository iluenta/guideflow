"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface MockupChatProps {
  id: string;
  property: string;
  time: string;
  guest: string;
  guide: string;
  status?: "resuelto" | "marcada";
}

const MockupChat = ({ id, property, time, guest, guide, status = "resuelto" }: MockupChatProps) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm shadow-[#124340]/5 space-y-6 transition-all border border-[#124340]/5 group hover:scale-[1.01] duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#D7E3E1] flex items-center justify-center font-[800] text-[#124340] text-[10px] uppercase font-manrope">
            {id.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-[#191C1C] font-manrope text-sm tracking-tight italic">Sesión {id.slice(0, 8)}</h4>
            <p className="text-[9px] text-[#124340]/40 font-bold uppercase tracking-[0.2em] font-manrope">
              {property} • {time}
            </p>
          </div>
        </div>
        <Badge className={cn(
          "rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-[0.2em] border-none shadow-none",
          status === "marcada" ? "bg-amber-100 text-amber-600 uppercase" : "bg-[#D7E3E1] text-[#124340] uppercase"
        )}>
          {status}
        </Badge>
      </div>

      <div className="bg-[#F2F4F3] rounded-[2.5rem] p-7 space-y-5">
        <div className="flex gap-6">
          <span className="text-[8px] font-black text-[#124340]/40 uppercase tracking-[0.3em] pt-1 min-w-[50px] font-manrope">HUÉSPED</span>
          <p className="text-sm font-inter text-[#191C1C] leading-relaxed tracking-wide">{guest}</p>
        </div>
        <div className="flex gap-6 border-t border-[#124340]/5 pt-5">
          <span className="text-[8px] font-black text-[#124340]/40 uppercase tracking-[0.3em] pt-1 min-w-[50px] font-manrope">GUÍA</span>
          <p className="text-sm font-inter text-[#191C1C]/60 leading-relaxed italic tracking-wide">
            {guide === "Esperando respuesta..." ? (
              <span className="text-[#124340]/30 animate-pulse">{guide}</span>
            ) : guide}
          </p>
        </div>
      </div>
    </div>
  );
};

interface MockupConversationListProps {
  conversations: any[];
  isLoading?: boolean;
}

export const MockupConversationList = ({ conversations, isLoading }: MockupConversationListProps) => {
  const [activeTab, setActiveTab] = useState<"recent" | "flagged" | "archived">("recent");

  const filteredConversations = conversations.filter((c: any) => {
    if (activeTab === "flagged") return c.isFlagged;
    if (activeTab === "archived") return c.isArchived;
    return !c.isArchived; // "Recent" includes all non-archived ones
  });

  return (
    <div className="space-y-10">
      {/* Tabs and Filter from Image 3 */}
      <div className="flex items-center justify-between border-b border-[#124340]/5 pb-[1px] px-2 relative">
        <div className="flex gap-10">
          <button 
            onClick={() => setActiveTab("recent")}
            className={cn(
                "text-[10px] font-bold uppercase tracking-[0.25em] font-manrope pb-4 relative transition-colors duration-300",
                activeTab === "recent" ? "text-[#124340]" : "text-[#124340]/30 hover:text-[#124340]/60"
            )}
          >
            Conversaciones Recientes
            {activeTab === "recent" && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#124340] animate-in slide-in-from-left-2 duration-300" />}
          </button>
          <button 
            onClick={() => setActiveTab("flagged")}
            className={cn(
                "text-[10px] font-bold uppercase tracking-[0.25em] font-manrope pb-4 relative transition-colors duration-300",
                activeTab === "flagged" ? "text-[#124340]" : "text-[#124340]/30 hover:text-[#124340]/60"
            )}
          >
            Sesiones Marcadas
            {activeTab === "flagged" && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#124340] animate-in slide-in-from-left-2 duration-300" />}
          </button>
          <button 
            onClick={() => setActiveTab("archived")}
            className={cn(
                "text-[10px] font-bold uppercase tracking-[0.25em] font-manrope pb-4 relative transition-colors duration-300",
                activeTab === "archived" ? "text-[#124340]" : "text-[#124340]/30 hover:text-[#124340]/60"
            )}
          >
            Archivadas
            {activeTab === "archived" && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#124340] animate-in slide-in-from-left-2 duration-300" />}
          </button>
        </div>
        
        <div className="pb-4">
          <Button variant="ghost" className="h-10 rounded-xl bg-[#F2F4F3] border-none text-[9px] font-bold uppercase tracking-widest text-[#124340]/60 px-4 hover:bg-[#D7E3E1] transition-colors">
            <Filter size={12} className="mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((chat: any) => (
            <MockupChat 
              key={chat.id}
              id={chat.id} 
              property={chat.property} 
              time={chat.time} 
              guest={chat.guest} 
              guide={chat.guide} 
              status={chat.status}
            />
          ))
        ) : (
          <div className="py-20 text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-[#F2F4F3] rounded-full flex items-center justify-center mx-auto opacity-40">
               <MessageSquare className="w-8 h-8 text-[#124340]" />
            </div>
            <p className="text-sm text-[#124340]/30 font-manrope italic leading-relaxed max-w-xs mx-auto">
               No hay sesiones {activeTab === "flagged" ? "marcadas" : activeTab === "archived" ? "archivadas" : "recientes"} en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
