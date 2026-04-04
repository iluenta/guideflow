"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Clock, Phone, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  variant?: "default" | "dark";
  isLoading?: boolean;
}

function StatCard({ label, value, icon: Icon, variant = "default", isLoading }: StatCardProps) {
  const isDark = variant === "dark";

  return (
    <Card className={cn(
      "border-none shadow-curator rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02]",
      isDark ? "bg-curator-primary text-white" : "bg-white text-curator-on-surface"
    )}>
      <CardContent className="p-8 space-y-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
          isDark ? "bg-white/10" : "bg-curator-mint"
        )}>
          <Icon className={cn("w-6 h-6", isDark ? "text-teal-300" : "text-curator-primary")} />
        </div>
        <div className="space-y-1">
          {isLoading ? (
            <div className={cn("h-10 w-20 animate-pulse rounded-lg", isDark ? "bg-white/10" : "bg-curator-mint")} />
          ) : (
            <p className="text-5xl font-extrabold tracking-tighter font-manrope">
              {value}
            </p>
          )}
          <p className={cn(
            "text-[11px] font-bold uppercase tracking-[0.2em] font-manrope leading-tight",
            isDark ? "text-white/60" : "text-curator-on-surface/40"
          )}>
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExecutiveSummaryProps {
  totalConversations: number;
  languagesCount: number;
  isLoading?: boolean;
}

export function ExecutiveSummaryCard({ totalConversations, languagesCount, isLoading }: ExecutiveSummaryProps) {
  const timeSavedHours = Math.floor((totalConversations * 12) / 60);
  const callsAvoided = Math.round(totalConversations * 0.2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        label="Conversations" 
        value={totalConversations} 
        icon={MessageSquare} 
        isLoading={isLoading} 
      />
      <StatCard 
        label="Time Saved" 
        value={`~${timeSavedHours}h`} 
        icon={Clock} 
        isLoading={isLoading} 
      />
      <StatCard 
        label="Calls Avoided" 
        value={callsAvoided} 
        icon={Phone} 
        isLoading={isLoading} 
      />
      <StatCard 
        label="Languages" 
        value={languagesCount} 
        icon={Globe} 
        variant="dark"
        isLoading={isLoading} 
      />
    </div>
  );
}
