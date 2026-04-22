"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  ArrowRight,
  MapPin,
  Clock
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";

const stats = [
  {
    name: "Reservas este mes",
    value: "12",
    change: "23%",
    trend: "up" as const,
    icon: Calendar,
    variant: "navy" as const
  },
  {
    name: "Ocupacion",
    value: "78",
    unit: "%",
    change: "5%",
    trend: "up" as const,
    icon: TrendingUp,
    variant: "mint" as const
  },
  {
    name: "Huespedes activos",
    value: "4",
    change: "0",
    trend: "flat" as const,
    icon: Users,
    variant: "amber" as const
  },
  {
    name: "Ingresos del mes",
    value: "2.450",
    unit: "€",
    change: "12%",
    trend: "up" as const,
    icon: DollarSign,
    variant: "navy" as const
  },
];

const properties = [
  {
    id: 1,
    name: "Apartamento Centro Madrid",
    status: "occupied",
    guest: "Carlos Martinez",
    checkOut: "28 Ene",
    location: "Madrid, ES",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Casa Rural Asturias",
    status: "available",
    guest: null,
    checkOut: null,
    location: "Asturias, ES",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Estudio Playa Valencia",
    status: "occupied",
    guest: "Ana Garcia",
    checkOut: "25 Ene",
    location: "Valencia, ES",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "booking",
    message: "Nueva reserva en Apartamento Centro Madrid",
    time: "Hace 2h",
  },
  {
    id: 2,
    type: "booking",
    message: "Nueva reserva confirmada - Casa Rural",
    time: "Hace 5h",
  },
  {
    id: 3,
    type: "checkout",
    message: "Check-out completado en Estudio Valencia",
    time: "Ayer",
  },
  {
    id: 4,
    type: "chat",
    message: "Huésped preguntó por la clave WiFi",
    time: "Ayer",
  },
];

function DashboardErrorHandler() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({ title: "Aviso", description: error, variant: "destructive" });
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState(null, '', url.toString());
    }
  }, [searchParams, toast]);

  return null;
}

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <Suspense fallback={null}><DashboardErrorHandler /></Suspense>
      
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-landing-mint-deep shadow-[0_0_0_4px_rgba(45,212,191,0.2)]"></div>
            <span className="font-jetbrains text-[11px] tracking-[0.15em] uppercase text-landing-ink-mute">Panel de Control</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-landing-navy sm:text-5xl">
            Buenos días, <span className="text-landing-mint-deep">Usuario</span>
          </h1>
          <p className="mt-2 text-landing-ink-soft max-w-[520px]">
            Aquí tienes un resumen de tus alojamientos y actividad reciente.
          </p>
        </div>
        <Link href="/dashboard/properties">
          <Button className="bg-landing-navy text-white rounded-full h-12 px-8 hover:bg-landing-navy-deep transition-all shadow-lg shadow-landing-navy/20 active:scale-95">
            <Plus className="h-4 w-4 mr-2" />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard 
            key={stat.name}
            label={stat.name}
            value={stat.value}
            unit={stat.unit}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Properties List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-landing-rule-soft rounded-[24px] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-landing-rule-soft">
              <div>
                <h3 className="font-bold text-lg text-landing-navy">Tus propiedades</h3>
                <p className="text-xs text-landing-ink-mute mt-0.5">Gestión de tus alojamientos activos</p>
              </div>
              <Link href="/dashboard/properties">
                <Button variant="ghost" size="sm" className="text-landing-navy hover:bg-landing-navy-tint rounded-full gap-1.5 text-xs font-bold">
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="p-6 space-y-2">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center gap-5 p-3 rounded-2xl border border-transparent hover:border-landing-rule-soft hover:bg-landing-bg/50 transition-all group">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-landing-bg-deep shadow-sm">
                    <Image src={property.image} alt={property.name} fill className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px] text-landing-ink mb-1 truncate">{property.name}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] text-landing-ink-soft">
                        <MapPin className="h-3 w-3 text-landing-ink-mute" />
                        {property.location}
                      </div>
                      <span className="text-landing-ink-mute text-[10px]">•</span>
                      <div className="flex items-center gap-1 text-[11px] text-landing-ink-soft">
                        <Clock className="h-3 w-3 text-landing-ink-mute" />
                        Check-out: {property.checkOut || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`
                      font-jetbrains text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5
                      ${property.status === 'occupied' 
                        ? 'bg-landing-navy-tint text-landing-navy' 
                        : 'bg-landing-mint-tint text-landing-mint-deep'}
                    `}>
                      <div className={`w-1.5 h-1.5 rounded-full ${property.status === 'occupied' ? 'bg-landing-navy' : 'bg-landing-mint-deep'}`}></div>
                      {property.status === 'occupied' ? 'Ocupado' : 'Disponible'}
                    </div>
                    <Link href={`/dashboard/properties/${property.id}`} className="p-2 rounded-lg text-landing-ink-mute hover:text-landing-navy hover:bg-landing-navy-tint transition-all opacity-0 group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-landing-rule-soft rounded-[24px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-landing-rule-soft">
            <h3 className="font-bold text-lg text-landing-navy">Actividad reciente</h3>
            <p className="text-xs text-landing-ink-mute mt-0.5">Últimos eventos en tus propiedades</p>
          </div>
          <div className="p-4 flex-1">
            {recentActivity.map((activity) => (
              <ActivityItem 
                key={activity.id}
                type={activity.type}
                message={activity.message}
                time={activity.time}
              />
            ))}
          </div>
          <div className="p-4 bg-landing-bg-deep/50 text-center">
            <button className="text-[11px] font-bold text-landing-navy uppercase tracking-widest hover:underline">
              Ver historial completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
