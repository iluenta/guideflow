"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon: LucideIcon;
  variant?: "navy" | "mint" | "amber";
}

export const StatCard = ({ 
  label, 
  value, 
  unit, 
  change, 
  trend = "flat", 
  icon: Icon,
  variant = "navy"
}: StatCardProps) => {
  return (
    <div className="bg-landing-bg-card border border-landing-rule-soft rounded-[18px] p-5.5 transition-all duration-200 hover:border-landing-navy-soft hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(30,58,138,0.15)] group">
      <div className="flex justify-between items-start mb-5">
        <span className="font-jetbrains text-[10px] tracking-[0.12em] uppercase text-landing-ink-mute">
          {label}
        </span>
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          variant === "navy" && "bg-landing-navy-tint text-landing-navy",
          variant === "mint" && "bg-landing-mint-tint text-landing-mint-deep",
          variant === "amber" && "bg-landing-amber-tint text-landing-amber",
        )}>
          <Icon className="h-[18px] w-[18px] stroke-[1.75]" />
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-[32px] font-bold tracking-tight text-landing-ink leading-none">
          {value}
        </span>
        {unit && <span className="text-xl font-medium text-landing-ink-mute">{unit}</span>}
      </div>

      <div className="flex justify-between items-center mt-3.5">
        <div className={cn(
          "font-jetbrains text-[11px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
          trend === "up" && "text-green-700 bg-green-50",
          trend === "down" && "text-landing-rose bg-landing-rose-tint",
          trend === "flat" && "text-landing-ink-soft bg-landing-bg-deep",
        )}>
          {trend === "up" && "+"}
          {change}
        </div>

        {/* Mini sparkline placeholder */}
        <div className="w-[70px] h-[28px] opacity-40 group-hover:opacity-100 transition-opacity">
          <svg width="100%" height="100%" viewBox="0 0 70 28" preserveAspectRatio="none">
            <path 
              d="M0 20 Q10 5 20 15 T40 10 T70 25" 
              fill="none" 
              className={cn(
                "stroke-[1.75]",
                variant === "navy" ? "stroke-landing-navy" : "stroke-landing-mint-deep"
              )} 
              strokeLinecap="round" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
