"use client";

import { cn } from "@/lib/utils";

interface SectionUsage {
  section: string;
  count: number;
}

interface GuestInsightsBarProps {
  data: SectionUsage[];
  isLoading?: boolean;
}

const SECTION_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  checkin:    { label: "Check-in / Acceso",       icon: "🔑", color: "bg-blue-600",   bg: "bg-blue-50 text-blue-600" },
  wifi:       { label: "WiFi / Conectividad",     icon: "📶", color: "bg-teal-500",   bg: "bg-teal-50 text-teal-600" },
  eat:        { label: "Dining / Recomendaciones", icon: "🍽️", color: "bg-orange-400", bg: "bg-orange-50 text-orange-600" },
  rules:      { label: "Normas / Limpieza",        icon: "🧹", color: "bg-purple-500", bg: "bg-purple-50 text-purple-600" },
  "house-info": { label: "Info Propiedad",         icon: "🏠", color: "bg-slate-500",  bg: "bg-slate-50 text-slate-600" },
  manuals:    { label: "Electrodomésticos",        icon: "⚙️", color: "bg-slate-400",  bg: "bg-slate-50 text-slate-500" },
  emergency:  { label: "Emergencias",              icon: "🆘", color: "bg-red-500",    bg: "bg-red-50 text-red-600" },
  welcome:    { label: "Bienvenida",               icon: "👋", color: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-600" },
  do:         { label: "Qué hacer",               icon: "🎯", color: "bg-green-500",  bg: "bg-green-50 text-green-600" },
};

const DEFAULT_CONFIG = { label: "", icon: "📌", color: "bg-slate-300", bg: "bg-slate-50 text-slate-500" };

export function GuestInsightsBar({ data, isLoading }: GuestInsightsBarProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const top5 = data
    .map(d => ({
      ...d,
      pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
      config: SECTION_CONFIG[d.section] ?? { ...DEFAULT_CONFIG, label: d.section },
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-[#000d37] font-manrope mb-6">
        Lo que buscan tus huéspedes
      </h3>

      {isLoading ? (
        <div className="space-y-5 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                <div className="h-1.5 bg-slate-100 animate-pulse rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : top5.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-300">Sin datos de consulta todavía</p>
        </div>
      ) : (
        <div className="space-y-5 flex-1">
          {top5.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              {/* Icon box */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0",
                item.config.bg.split(" ")[0]
              )}>
                {item.config.icon}
              </div>

              {/* Bar + label */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1.5">
                  <span className="font-bold text-sm text-[#000d37]">
                    {item.config.label || item.section}
                  </span>
                  <span className="text-xs text-slate-500">{item.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", item.config.color)}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
