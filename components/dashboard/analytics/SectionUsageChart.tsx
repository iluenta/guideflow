"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface SectionUsage {
  section: string;
  count: number;
}

interface SectionUsageChartProps {
  data: SectionUsage[];
  isLoading?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  welcome: "Bienvenida",
  wifi: "WiFi / Internet",
  rules: "Normas de la Casa",
  checkin: "Llegada y Llaves",
  manuals: "Electrodomésticos",
  eat: "Dónde Comer",
  do: "Actividades Locales",
  shopping: "Compras Básicas",
  emergency: "Contactos de Emergencia",
  houseinfo: "Info de la Propiedad",
};

export function SectionUsageChart({ data, isLoading }: SectionUsageChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  const formattedData = data
    .map(d => ({
      id: d.section,
      name: SECTION_LABELS[d.section] || d.section,
      value: d.count,
      percentage: total > 0 ? (d.count / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Generar Insight Automático
  let automatedInsight = null;
  if (formattedData.length > 0) {
    const top2 = formattedData.slice(0, 2).map(f => f.id);
    if (top2.includes('manuals')) {
      automatedInsight = "Tus huéspedes buscan mucho los electrodomésticos. Considera añadir más manuales o fotos.";
    } else if (top2.includes('checkin')) {
      automatedInsight = "El acceso es una de las mayores dudas. Revisa si las instrucciones de llegada son suficientemente claras.";
    } else if (top2.includes('eat')) {
      automatedInsight = "Tus huéspedes valoran la gastronomía. Mantén tus recomendaciones de restaurantes actualizadas.";
    }
  }

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden p-2">
      <CardHeader className="pb-6 pt-5 px-6">
        <CardTitle className="text-[14px] font-extrabold text-slate-800 font-manrope">
          Qué buscan más tus huéspedes
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 font-medium font-manrope mt-1">
          Las secciones más consultadas en la guía digital.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 space-y-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                <div className="h-4 w-16 bg-slate-100 animate-pulse rounded" />
              </div>
              <div className="h-2.5 w-full bg-slate-100 animate-pulse rounded-full" />
            </div>
          ))
        ) : formattedData.length > 0 ? (
          <>
            <div className="space-y-5">
              {formattedData.map((theme, index) => (
                <div key={index} className="space-y-2 group cursor-pointer">
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-[12px] font-bold text-slate-700 font-manrope transition-colors group-hover:text-curator-primary">
                      {theme.name}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 font-manrope">
                      {Math.round(theme.percentage)}% <span className="font-normal opacity-70">({theme.value} vistas)</span>
                    </p>
                  </div>
                  <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
                        index === 0 ? "bg-curator-primary" : "bg-curator-teal/40 group-hover:bg-curator-teal"
                      )}
                      style={{ width: `${theme.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {automatedInsight && (
              <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3 items-start">
                <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900/80 font-medium leading-relaxed font-manrope">
                  {automatedInsight}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center opacity-80">
               <div className="w-6 h-1 bg-slate-200 rounded-full" />
            </div>
            <p className="text-xs font-manrope text-slate-400">Sin datos de consulta todavía.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
