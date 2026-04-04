"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChatAnalyticsProps {
  avgMessages: number;
  avgDuration: number;
  totalResolved: number;
  intentDistribution: { intent: string; count: number }[];
  isLoading?: boolean;
}

const INTENT_LABELS: Record<string, string> = {
  wifi: "WiFi",
  checkin: "Acceso/Llegada",
  recommendation_food: "Restaurantes",
  recommendation_activity: "Actividades",
  rules: "Normas Casa",
  appliance_usage: "Electrodomésticos",
  emergency: "Emergencias",
  manual_request: "Manuales",
  general: "General",
};

const COLORS = ["#124340", "#2D5A57", "#406561", "#739995", "#A7CECA"];

// ─── Métricas de sesión (sidebar) ─────────────────────────────────────────────
export function SessionMetrics({
  avgMessages,
  avgDuration,
  totalResolved,
  isLoading,
}: Omit<ChatAnalyticsProps, "intentDistribution">) {
  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-[9px] font-bold uppercase tracking-[0.25em] text-curator-teal/50 font-manrope">
            Interaction Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 px-5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-curator-on-surface font-manrope tracking-tighter leading-none">
                {avgMessages.toFixed(0)}
              </p>
              <p className="text-[8px] font-bold text-curator-on-surface/40 uppercase tracking-widest font-manrope mt-0.5">
                Messages / Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-curator-on-surface font-manrope tracking-tighter leading-none">
                {Math.floor(avgDuration / 60)}m {Math.round(avgDuration % 60)}s
              </p>
              <p className="text-[8px] font-bold text-curator-on-surface/40 uppercase tracking-widest font-manrope mt-0.5">
                Avg Duration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-curator-mint flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-curator-primary" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-curator-on-surface font-manrope tracking-tighter leading-none">
                {totalResolved}%
              </p>
              <p className="text-[8px] font-bold text-curator-on-surface/40 uppercase tracking-widest font-manrope mt-0.5">
                Automated Resolution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-curator-teal text-white rounded-2xl relative overflow-hidden">
        <CardContent className="p-5 relative z-10">
          <div className="flex flex-col gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <p className="font-bold text-sm font-manrope">Implicit Satisfaction</p>
              <p className="text-[11px] text-teal-100/70 mt-1.5 leading-relaxed font-manrope font-light italic">
                "Short sessions with low message counts indicate your guests are finding information
                instantly. Your guide is performing perfectly as a silent concierge."
              </p>
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2 blur-xl" />
      </Card>
    </div>
  );
}

// ─── Chart de intents (área principal) ────────────────────────────────────────
export function IntentDistributionChart({
  intentDistribution,
  isLoading,
}: Pick<ChatAnalyticsProps, "intentDistribution" | "isLoading">) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-[9px] font-bold uppercase tracking-[0.25em] text-curator-teal/50 font-manrope">
          Intelligence Insights
        </CardTitle>
        <h3 className="text-base font-extrabold text-curator-on-surface font-manrope mt-1 tracking-tight">
          Recurring Guest Inquiries
        </h3>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <div className="h-[220px] w-full">
          {intentDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={intentDistribution}
                layout="vertical"
                margin={{ left: 50, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="intent"
                  tick={{
                    fontSize: 9,
                    fontWeight: 700,
                    fill: "#124340",
                    fontFamily: "var(--font-manrope)",
                  }}
                  width={100}
                  tickFormatter={(val) => (INTENT_LABELS[val] || val).toUpperCase()}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(242, 244, 243, 0.5)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 8px 24px rgba(18, 67, 64, 0.1)",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#124340",
                    fontFamily: "var(--font-manrope)",
                    textTransform: "uppercase",
                  }}
                  labelStyle={{ display: "none" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                  {intentDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-curator-teal/40 italic">
              <div className="w-14 h-14 rounded-full bg-curator-mint flex items-center justify-center">
                <BarChart className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-xs font-manrope">Deep learning in progress... More data needed.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Export combinado por retrocompatibilidad ──────────────────────────────────
export function ChatAnalytics(props: ChatAnalyticsProps) {
  return (
    <div className="space-y-4">
      <SessionMetrics
        avgMessages={props.avgMessages}
        avgDuration={props.avgDuration}
        totalResolved={props.totalResolved}
        isLoading={props.isLoading}
      />
      <IntentDistributionChart
        intentDistribution={props.intentDistribution}
        isLoading={props.isLoading}
      />
    </div>
  );
}