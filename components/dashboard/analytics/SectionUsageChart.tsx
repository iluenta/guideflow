"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SectionUsage {
  section: string;
  count: number;
}

interface SectionUsageChartProps {
  data: SectionUsage[];
  isLoading?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  welcome: "Welcome / Intro",
  wifi: "WiFi Credentials",
  rules: "House Rules",
  checkin: "Check-in / Access",
  manuals: "Appliances / Manuals",
  eat: "Dining Recommendations",
  do: "Local Activities",
  shopping: "Essentials & Shopping",
  emergency: "Emergency Contacts",
  houseinfo: "Property Details",
};

export function SectionUsageChart({ data, isLoading }: SectionUsageChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  const formattedData = data
    .map(d => ({
      name: SECTION_LABELS[d.section] || d.section,
      value: d.count,
      percentage: total > 0 ? (d.count / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <Card className="border-none shadow-curator bg-white rounded-[2rem] overflow-hidden p-2">
      <CardHeader className="pb-6 pt-8 px-8">
        <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-curator-teal/60 font-manrope">
          Topic Consultation
        </CardTitle>
        <CardDescription className="text-xl font-extrabold text-curator-on-surface font-manrope mt-1">
          Most Consulted Themes
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-10 space-y-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-curator-mint animate-pulse rounded" />
                <div className="h-4 w-12 bg-curator-mint animate-pulse rounded" />
              </div>
              <div className="h-2 w-full bg-curator-mint animate-pulse rounded-full" />
            </div>
          ))
        ) : formattedData.length > 0 ? (
          formattedData.map((theme, index) => (
            <div key={index} className="space-y-3 group">
              <div className="flex justify-between items-center gap-4">
                <p className="text-[11px] font-bold text-curator-teal/70 uppercase tracking-widest font-manrope transition-colors group-hover:text-curator-primary">
                  {theme.name}
                </p>
                <p className="text-[11px] font-black text-curator-on-surface/40 font-manrope">
                  {Math.round(theme.percentage)}%
                </p>
              </div>
              <div className="relative h-2 w-full bg-curator-mint rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
                    index === 0 ? "bg-curator-primary" : "bg-curator-teal/40"
                  )}
                  style={{ width: `${theme.percentage}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-curator-mint flex items-center justify-center opacity-30">
               <div className="w-6 h-1 bg-curator-teal rounded-full" />
            </div>
            <p className="text-sm font-manrope text-curator-teal/40 italic">Aggregating consultation patterns...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
