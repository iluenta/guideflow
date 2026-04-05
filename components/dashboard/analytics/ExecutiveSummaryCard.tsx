"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, AlertCircle, Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  value: number;
  percentage: number;
  isPositiveGood: boolean; // Si subir es bueno (ej. conversaciones) o malo (ej. gaps)
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  trend?: TrendData;
  variant?: "default" | "dark" | "alert";
  isLoading?: boolean;
}

function TrendIndicator({ trend }: { trend: TrendData }) {
  if (trend.percentage === 0) {
    return (
      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-2">
        <Minus className="w-3 h-3" />
        <span>Sin cambios</span>
      </div>
    );
  }

  const isUp = trend.percentage > 0;
  const isGood = isUp === trend.isPositiveGood;

  return (
    <div className={cn(
      "flex items-center gap-1 text-[10px] font-bold mt-2",
      isGood ? "text-emerald-600" : "text-amber-600"
    )}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{Math.abs(trend.percentage)}% vs mes pasado</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, variant = "default", isLoading }: StatCardProps) {
  const isDark = variant === "dark";
  const isAlert = variant === "alert";

  let bgClass = "bg-white text-curator-on-surface";
  let iconBgClass = "bg-curator-mint";
  let iconColorClass = "text-curator-primary";

  if (isDark) {
    bgClass = "bg-curator-primary text-white";
    iconBgClass = "bg-white/10";
    iconColorClass = "text-teal-300";
  } else if (isAlert) {
    bgClass = "bg-amber-50 text-amber-900";
    iconBgClass = "bg-amber-100";
    iconColorClass = "text-amber-600";
  }

  return (
    <Card className={cn(
      "border-none shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      bgClass
    )}>
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            iconBgClass
          )}>
            <Icon className={cn("w-4 h-4", iconColorClass)} />
          </div>
          <div className="space-y-0.5">
            {isLoading ? (
              <div className={cn("h-8 w-16 animate-pulse rounded-lg", isDark ? "bg-white/10" : "bg-black/5")} />
            ) : (
              <p className="text-4xl font-extrabold tracking-tighter font-manrope leading-none">
                {value}
              </p>
            )}
            <p className={cn(
              "text-[9px] font-bold uppercase tracking-[0.1em] font-manrope",
              isDark ? "text-white/60" : "text-slate-500",
              isAlert && "text-amber-700/70"
            )}>
              {label}
            </p>
          </div>
        </div>
        
        {!isLoading && trend && (
          <TrendIndicator trend={trend} />
        )}
      </CardContent>
    </Card>
  );
}

export interface ExecutiveSummaryProps {
  totalConversations: { current: number; trend: number };
  answeredRate: { current: number; trend: number }; // Percentage 0-100
  unansweredGaps: { current: number; trend: number };
  languagesCount: number;
  isLoading?: boolean;
}

export function ExecutiveSummaryCard({
  totalConversations,
  answeredRate,
  unansweredGaps,
  languagesCount,
  isLoading,
}: ExecutiveSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Conversaciones"
        value={totalConversations.current}
        trend={{ value: totalConversations.current, percentage: totalConversations.trend, isPositiveGood: true }}
        icon={MessageSquare}
        isLoading={isLoading}
      />
      <StatCard
        label="Tasa de Respuesta"
        value={`${answeredRate.current}%`}
        trend={{ value: answeredRate.current, percentage: answeredRate.trend, isPositiveGood: true }}
        icon={CheckCircle2}
        isLoading={isLoading}
      />
      <StatCard
        label="Preguntas sin respuesta"
        value={unansweredGaps.current}
        trend={{ value: unansweredGaps.current, percentage: unansweredGaps.trend, isPositiveGood: false }}
        icon={AlertCircle}
        variant={unansweredGaps.current > 0 ? "alert" : "default"}
        isLoading={isLoading}
      />
      <StatCard
        label="Idiomas Activos"
        value={languagesCount}
        icon={Globe}
        variant="dark"
        isLoading={isLoading}
      />
    </div>
  );
}