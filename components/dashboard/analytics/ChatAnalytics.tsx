"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractionMetricsProps {
  avgMessages: number;
  avgDuration: number;
  topLanguage?: { language: string; percentage: number };
  isLoading?: boolean;
}

const getLanguageName = (langCode?: string) => {
  const code = langCode?.toLowerCase().slice(0, 2);
  switch (code) {
    case 'es': return 'Español';
    case 'en': return 'Inglés';
    case 'fr': return 'Francés';
    case 'de': return 'Alemán';
    case 'it': return 'Italiano';
    case 'pt': return 'Portugués';
    default: return langCode ? langCode.charAt(0).toUpperCase() + langCode.slice(1) : 'Desconocido';
  }
};

export function InteractionMetrics({
  avgMessages,
  avgDuration,
  topLanguage,
  isLoading,
}: InteractionMetricsProps) {
  
  // Lógica de interpretación automática recomendada
  let msgInsight = "Flujo de conversación normal.";
  let msgStatus = "default";
  
  if (avgMessages > 0 && avgMessages < 4) {
    msgInsight = "Tus huéspedes encuentran la información rápido ✓";
    msgStatus = "good";
  } else if (avgMessages > 8) {
    msgInsight = "Tus huéspedes necesitan varios intentos. Revisa los gaps.";
    msgStatus = "warning";
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50">
          <CardTitle className="text-[14px] font-extrabold text-slate-800 font-manrope">
            Cómo interactúan tus huéspedes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-6 pt-5 bg-slate-50/20">
          
          {/* Mensajes por sesión */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                msgStatus === "good" ? "bg-emerald-50 text-emerald-600" :
                msgStatus === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
              )}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800 font-manrope tracking-tighter leading-none">
                  {isLoading ? "-" : avgMessages.toFixed(1)}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-manrope mt-1">
                  Mensajes por sesión
                </p>
              </div>
            </div>
            {!isLoading && avgMessages > 0 && (
              <p className={cn(
                "text-[11px] font-medium leading-relaxed font-manrope pl-11",
                msgStatus === "good" ? "text-emerald-700" :
                msgStatus === "warning" ? "text-amber-700" : "text-slate-500"
              )}>
                {msgInsight}
              </p>
            )}
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Duración */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 font-manrope tracking-tighter leading-none">
                {isLoading ? "-" : `${Math.floor(avgDuration / 60)}m ${Math.round(avgDuration % 60)}s`}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-manrope mt-1">
                Tiempo de resolución medio
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Idioma (si existe) */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800 font-manrope tracking-tighter leading-none capitalize">
                  {isLoading ? "-" : topLanguage?.language ? getLanguageName(topLanguage.language) : "N/A"}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-manrope mt-1">
                  Idioma principal
                </p>
              </div>
            </div>
            {!isLoading && topLanguage && (
              <p className="text-[11px] font-medium leading-relaxed font-manrope pl-11 text-slate-500">
                El {Math.round(topLanguage.percentage)}% de tus huéspedes prefiere comunicarse en este idioma.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}