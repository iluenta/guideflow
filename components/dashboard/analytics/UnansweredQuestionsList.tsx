"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-none shadow-curator bg-white rounded-3xl overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-curator-mint/50 p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <MessageCircleOff className="w-6 h-6 text-curator-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-extrabold text-curator-on-surface font-manrope tracking-tight">Silent Queries</CardTitle>
            <CardDescription className="text-curator-teal/60 font-medium font-manrope text-sm leading-snug">
              Encounters where the guide reached its current limits.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        {questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-4 bg-curator-surface/30 rounded-2xl hover:bg-curator-surface transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-4 h-4 text-curator-teal/40 group-hover:text-curator-primary transition-colors" />
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <p className="font-bold text-curator-on-surface leading-tight font-manrope">"{q.question}"</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-curator-primary/5 rounded-full border border-curator-primary/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-curator-primary animate-pulse" />
                        <span className="text-[9px] font-extrabold text-curator-primary uppercase tracking-widest font-manrope">
                          {q.times_asked} ASKED
                        </span>
                      </div>
                      <span className="text-[10px] text-curator-teal/40 font-bold font-manrope uppercase tracking-wider">
                        Last seen {new Date(q.asked_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl hover:bg-curator-primary hover:text-white text-curator-teal/50 font-bold text-[10px] uppercase tracking-widest gap-2 h-10 px-4 transition-all"
                >
                  <Link href={`/dashboard/properties/${propertyId}/setup`}>
                    Curate <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-curator-mint rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Plus className="w-8 h-8 text-curator-primary opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-curator-primary font-extrabold text-xl font-manrope">Seamless Knowledge</p>
              <p className="text-curator-teal/60 text-sm max-w-[280px] mx-auto font-manrope leading-relaxed">
                Your guide has resolved every query this month. The digital concierge is fully informed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      {questions.length > 0 && (
        <div className="px-8 py-6 bg-white border-t border-curator-surface flex justify-center">
            <Button asChild variant="link" className="text-curator-primary font-bold text-xs font-manrope tracking-widest uppercase hover:text-curator-teal group">
                <Link href={`/dashboard/properties/${propertyId}/setup`} className="flex items-center gap-2">
                    Enrich Knowledge Base <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
            </Button>
        </div>
      )}
    </Card>
  );
}
