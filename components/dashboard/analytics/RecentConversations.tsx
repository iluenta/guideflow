"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecentConversationsProps {
  conversations: any[];
  isLoading?: boolean;
}

export function RecentConversations({ conversations, isLoading }: RecentConversationsProps) {
  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-5 border-b border-curator-teal/10 pb-0 px-1">
        <button className="text-[10px] font-bold text-curator-primary uppercase tracking-widest border-b-2 border-curator-primary pb-3 -mb-px">
          Recent Conversations
        </button>
        <button className="text-[10px] font-bold text-curator-teal/40 uppercase tracking-widest pb-3 hover:text-curator-primary transition-colors">
          Flagged Sessions
        </button>
        <button className="text-[10px] font-bold text-curator-teal/40 uppercase tracking-widest pb-3 hover:text-curator-primary transition-colors">
          Archived
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3 pt-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl bg-white h-32 animate-pulse" />
          ))
        ) : conversations.length > 0 ? (
          conversations.map((chat) => (
            <Card
              key={chat.id}
              className="border-none shadow-sm rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-md group"
            >
              <CardContent className="p-5 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-curator-mint flex items-center justify-center font-bold text-curator-primary text-[9px] uppercase">
                      {chat.session_id?.slice(0, 2) || "G"}
                    </div>
                    <div>
                      <h4 className="font-bold text-[12px] text-curator-on-surface font-manrope leading-none">
                        Session {chat.session_id?.slice(0, 8)}
                      </h4>
                      <p className="text-[9px] text-curator-teal/40 font-bold uppercase tracking-widest mt-0.5">
                        {chat.property_name} • {new Date(chat.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-widest",
                      chat.status === "flagged"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {chat.status === "flagged" ? "FLAGGED" : "RESOLVED"}
                  </Badge>
                </div>

                {/* Conversation preview */}
                <div className="bg-curator-surface rounded-xl p-4 space-y-2">
                  <div className="flex gap-3">
                    <span className="text-[8px] font-black text-curator-teal/40 uppercase tracking-widest pt-0.5 min-w-[44px]">
                      GUEST
                    </span>
                    <p className="text-[11px] font-manrope text-curator-on-surface leading-snug font-medium italic">
                      {chat.first_question || "Sin mensaje inicial"}
                    </p>
                  </div>
                  <div className="flex gap-3 border-t border-curator-teal/5 pt-2">
                    <span className="text-[8px] font-black text-curator-teal/40 uppercase tracking-widest pt-0.5 min-w-[44px]">
                      GUIDE
                    </span>
                    <p className="text-[11px] font-manrope text-curator-on-surface/70 leading-snug line-clamp-1">
                      {chat.last_ai_response || "Sin respuesta todavía"}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-[9px] font-black uppercase tracking-widest text-curator-primary hover:bg-curator-primary/5 rounded-lg px-3 h-7"
                  >
                    <Link href={`/dashboard/chats/${chat.id}`} className="flex items-center gap-1.5">
                      Full Transcript <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-14 text-center space-y-4">
            <div className="w-12 h-12 bg-curator-mint rounded-full flex items-center justify-center mx-auto opacity-20">
              <MessageSquare className="w-6 h-6 text-curator-primary" />
            </div>
            <p className="text-xs text-curator-teal/40 font-manrope italic leading-relaxed max-w-xs mx-auto">
              The silence of a perfect experience. No recent sessions recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}