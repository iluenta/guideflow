"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  Star,
  LucideIcon
} from "lucide-react";

interface ActivityItemProps {
  type: string;
  message: string;
  time: string;
}

const icons: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  booking: { icon: Calendar, color: "text-landing-navy", bg: "bg-landing-navy-tint" },
  checkout: { icon: CheckCircle2, color: "text-landing-mint-deep", bg: "bg-landing-mint-tint" },
  chat: { icon: MessageSquare, color: "text-landing-amber", bg: "bg-landing-amber-tint" },
  review: { icon: Star, color: "text-green-600", bg: "bg-green-50" },
};

export const ActivityItem = ({ type, message, time }: ActivityItemProps) => {
  const config = icons[type] || icons.booking;
  const Icon = config.icon;

  return (
    <div className="flex gap-4 py-4 border-b border-landing-rule-soft last:border-0 group cursor-pointer hover:bg-landing-bg-deep/50 px-2 rounded-xl transition-all">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
        config.bg,
        config.color
      )}>
        <Icon className="h-5 w-5 stroke-[1.75]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-landing-ink leading-tight mb-1 group-hover:text-landing-navy transition-colors">
          {message}
        </p>
        <span className="font-jetbrains text-[10px] tracking-wider uppercase text-landing-ink-mute opacity-70">
          {time}
        </span>
      </div>
    </div>
  );
};
