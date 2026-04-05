"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleOff, Plus, ChevronRight, HelpCircle } from "lucide-react";
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

export function UnansweredQuestionsList({
  questions,
  propertyId,
  isLoading,
}: UnansweredQuestionsListProps) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
      <CardHeader className="bg-curator-mint/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <MessageCircleOff className="w-4 h-4 text-curator-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-extrabold text-curator-on-surface font-manrope tracking-tight leading-none">
              Silent Queries
            </CardTitle>
            <CardDescription className="text-[10px] text-curator-teal/60 font-medium font-manrope mt-0.5">
              Encounters where the guide reached its current limits.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-grow">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-curator-mint/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : questions.length > 0 ? (
          <>
            <div className="space-y-1.5">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3 bg-curator-surface/30 rounded-xl hover:bg-curator-surface transition-all duration-200 group"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <HelpCircle className="w-3.5 h-3.5 text-curator-teal/30 group-hover:text-curator-primary transition-colors shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-curator-on-surface leading-tight font-manrope truncate">
                        "{q.question}"
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[8px] font-extrabold text-curator-primary uppercase tracking-widest">
                          <span className="w-1 h-1 rounded-full bg-curator-primary animate-pulse" />
                          {q.times_asked}×
                        </span>
                        <span className="text-[8px] text-curator-teal/40 font-bold uppercase tracking-wider">
                          {new Date(q.asked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="rounded-lg hover:bg-curator-primary hover:text-white text-curator-teal/40 h-7 px-2 shrink-0 ml-2"
                  >
                    <Link href={`/dashboard/properties/${propertyId}/setup`}>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-center">
              <Button
                asChild
                variant="link"
                className="text-curator-primary font-bold text-[9px] font-manrope tracking-widest uppercase hover:text-curator-teal h-auto p-0 group"
              >
                <Link href={`/dashboard/properties/${propertyId}/setup`} className="flex items-center gap-1.5">
                  Enrich Knowledge Base
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-curator-mint rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6 text-curator-primary opacity-20" />
            </div>
            <div>
              <p className="text-curator-primary font-extrabold text-sm font-manrope">Seamless Knowledge</p>
              <p className="text-curator-teal/60 text-[11px] max-w-[220px] mx-auto font-manrope leading-relaxed mt-1">
                Your guide has resolved every query this month. The digital concierge is fully informed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}