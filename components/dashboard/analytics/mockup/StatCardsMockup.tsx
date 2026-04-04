"use client";

import { MessageSquare, Clock, Phone, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  variant?: "default" | "dark";
  isLoading?: boolean;
}

const StatCard = ({ label, value, icon: Icon, variant = "default", isLoading }: StatCardProps) => {
  const isDark = variant === "dark";
  return (
    <div className={cn(
      "p-8 rounded-[2rem] flex flex-col gap-6 shadow-sm shadow-[#124340]/5 border border-[#124340]/5 transition-all hover:scale-[1.02]",
      isDark ? "bg-[#124340] text-white" : "bg-white text-[#191C1C]"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        isDark ? "bg-white/10 text-white" : "bg-[#F2F4F3] text-[#316263]"
      )}>
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="space-y-0.5">
        {isLoading ? (
          <div className={cn("h-10 w-20 rounded-lg animate-pulse", isDark ? "bg-white/10" : "bg-[#F2F4F3]")} />
        ) : (
          <h3 className="text-4xl font-[800] font-manrope tracking-tighter leading-none">{value}</h3>
        )}
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em] font-manrope",
          isDark ? "text-white/40" : "text-[#191C1C]/30"
        )}>{label}</p>
      </div>
    </div>
  );
};

interface StatCardsMockupProps {
  stats?: {
    totalConversations: number;
    timeSaved: string;
    callsAvoided: number;
    languages: number;
  };
  isLoading?: boolean;
}

export const StatCardsMockup = ({ stats, isLoading }: StatCardsMockupProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
      <StatCard 
        label="Conversaciones" 
        value={stats?.totalConversations ?? 0} 
        icon={MessageSquare} 
        isLoading={isLoading}
      />
      <StatCard 
        label="Tiempo Ahorrado" 
        value={stats?.timeSaved ?? "~0h"} 
        icon={Clock} 
        isLoading={isLoading}
      />
      <StatCard 
        label="Llamadas Evitadas" 
        value={stats?.callsAvoided ?? 0} 
        icon={Phone} 
        isLoading={isLoading}
      />
      <StatCard 
        label="Idioma" 
        value={stats?.languages ?? 1} 
        icon={Globe} 
        variant="dark" 
        isLoading={isLoading}
      />
    </div>
  );
};
