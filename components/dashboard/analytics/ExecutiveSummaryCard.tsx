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
      "border-none shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      isDark ? "bg-curator-primary text-white" : "bg-white text-curator-on-surface"
    )}>
      <CardContent className="p-5 space-y-4">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          isDark ? "bg-white/10" : "bg-curator-mint"
        )}>
          <Icon className={cn("w-4 h-4", isDark ? "text-teal-300" : "text-curator-primary")} />
        </div>
        <div className="space-y-0.5">
          {isLoading ? (
            <div className={cn("h-8 w-16 animate-pulse rounded-lg", isDark ? "bg-white/10" : "bg-curator-mint")} />
          ) : (
            <p className="text-4xl font-extrabold tracking-tighter font-manrope leading-none">
              {value}
            </p>
          )}
          <p className={cn(
            "text-[9px] font-bold uppercase tracking-[0.2em] font-manrope",
            isDark ? "text-white/50" : "text-curator-on-surface/40"
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
  timeSaved: string;
  callsAvoided: number;
  languagesCount: number;
  isLoading?: boolean;
}

export function ExecutiveSummaryCard({
  totalConversations,
  timeSaved,
  callsAvoided,
  languagesCount,
  isLoading,
}: ExecutiveSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Conversations"
        value={totalConversations}
        icon={MessageSquare}
        isLoading={isLoading}
      />
      <StatCard
        label="Time Saved"
        value={timeSaved}
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