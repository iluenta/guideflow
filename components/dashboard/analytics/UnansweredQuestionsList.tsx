"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleOff, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";

interface UnansweredQuestion {
  id: string;
  question: string;
  times_asked: number;
  intent?: string;
  asked_at: string;
}

interface UnansweredQuestionsListProps {
  questions: UnansweredQuestion[];
  propertyId: string;
  isLoading?: boolean;
}

function getTabForIntent(intent?: string): string {
  switch (intent) {
    case 'wifi':
    case 'tech':
      return 'tech';
    case 'appliance_usage':
    case 'manual_request':
      return 'appliance-manuals';
    case 'checkin':
    case 'access':
      return 'checkin';
    case 'recommendation_food':
    case 'recommendation_activity':
      return 'dining';
    case 'rules':
      return 'rules';
    case 'emergency':
      return 'contacts';
    default:
      return 'welcome';
  }
}

export function UnansweredQuestionsList({
  questions,
  propertyId,
  isLoading,
}: UnansweredQuestionsListProps) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden flex flex-col h-full border border-red-50">
      <CardHeader className="bg-gradient-to-r from-amber-50/50 to-transparent px-8 py-6 border-b border-amber-100/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shadow-sm shrink-0">
            <MessageCircleOff className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-[14px] font-extrabold text-slate-800 font-manrope tracking-tight leading-none mb-1">
              Lo que tus huéspedes preguntan y tu guía no responde
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 font-medium font-manrope">
              Preguntas identificadas donde el asistente no tenía información suficiente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow bg-slate-50/30">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((q) => {
              const targetTab = getTabForIntent(q.intent);
              
              return (
                <div
                  key={q.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 group gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      <HelpCircle className="w-4 h-4 text-amber-500/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 leading-tight font-manrope">
                        "{q.question}"
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {q.times_asked}× veces
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Última vez: {new Date(q.asked_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 shrink-0 h-9 font-bold text-[10px] uppercase tracking-widest w-full sm:w-auto"
                  >
                    <Link href={`/dashboard/properties/${propertyId}/setup?tab=${targetTab}`}>
                      Añadir a la guía <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-slate-800 font-extrabold text-sm font-manrope">¡Todo perfecto!</p>
              <p className="text-slate-500 text-[12px] max-w-[250px] mx-auto font-manrope mt-1">
                Tu guía responde todo lo que preguntan tus huéspedes. Buen trabajo.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}