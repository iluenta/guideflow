"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

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
    name: "Ocupación",
    value: "78",
    unit: "%",
    change: "5%",
    trend: "up" as const,
    icon: TrendingUp,
    variant: "mint" as const
  },
  {
    name: "Huéspedes activos",
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
    statusLabel: "Ocupado",
    guest: "Carlos Martinez",
    checkOut: "28 Ene",
    location: "Madrid, ES",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Casa Rural Asturias",
    status: "available",
    statusLabel: "Disponible",
    guest: null,
    checkOut: null,
    location: "Asturias, ES",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Estudio Playa Valencia",
    status: "occupied",
    statusLabel: "Ocupado",
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
    icon: Calendar,
    color: "navy",
    message: "Nueva reserva en <strong>Apartamento Centro Madrid</strong>",
    time: "Hace 2h",
  },
  {
    id: 2,
    type: "booking",
    icon: Calendar,
    color: "navy",
    message: "Nueva reserva confirmada - <strong>Casa Rural</strong>",
    time: "Hace 5h",
  },
  {
    id: 3,
    type: "checkout",
    icon: CheckCircle2,
    color: "mint",
    message: "Check-out completado en <strong>Estudio Valencia</strong>",
    time: "Ayer",
  },
  {
    id: 4,
    type: "chat",
    icon: MessageSquare,
    color: "amber",
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
    <div className="space-y-8">
      <Suspense fallback={null}><DashboardErrorHandler /></Suspense>
      
      {/* Page Header */}
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-landing-mint-deep shadow-[0_0_0_4px_rgba(45,212,191,0.2)]"></div>
            <span className="font-jetbrains text-[11px] tracking-[0.15em] uppercase text-landing-ink-mute">Panel de Control</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-landing-navy sm:text-[36px] leading-[1.05]">
            Buenos días, <span className="text-landing-mint-deep italic font-normal">Usuario</span>
          </h1>
          <p className="mt-2 text-landing-ink-soft max-w-[520px] text-[15px]">
            Aquí tienes un resumen de tus alojamientos y actividad reciente.
          </p>
        </div>
        <Link href="/dashboard/properties">
          <Button className="bg-landing-navy text-white rounded-full h-11 px-6 hover:bg-landing-navy-deep transition-all shadow-lg shadow-landing-navy/20 active:scale-95 font-medium text-[13px]">
            <Plus className="h-4 w-4 mr-2" />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Properties Section */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-landing-rule-soft rounded-[18px] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-landing-rule-soft">
              <div>
                <h3 className="font-semibold text-[15px] text-landing-ink tracking-tight">Tus propiedades</h3>
                <p className="text-[12px] text-landing-ink-mute mt-0.5">Gestión de tus alojamientos activos</p>
              </div>
              <Link href="/dashboard/properties">
                <Button variant="ghost" size="sm" className="text-landing-navy hover:bg-landing-navy-tint rounded-full gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            
            <div className="p-6 pt-2 divide-y divide-landing-rule-soft">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center gap-4 py-4 group first:pt-0 last:pb-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-landing-bg-deep border border-landing-rule-soft">
                    <Image src={property.image} alt={property.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-landing-ink mb-1 truncate tracking-tight">{property.name}</h4>
                    <div className="flex items-center gap-3 text-[12px] text-landing-ink-soft">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-landing-ink-mute" />
                        {property.location}
                      </div>
                      <span className="text-landing-ink-mute text-[10px]">•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-landing-ink-mute" />
                        Check-out: {property.checkOut || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`
                      font-jetbrains text-[10px] font-medium tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-2
                      ${property.status === 'occupied' 
                        ? 'bg-landing-navy-tint text-landing-navy' 
                        : 'bg-landing-mint-tint text-landing-mint-deep'}
                    `}>
                      <div className={`w-1.5 h-1.5 rounded-full ${property.status === 'occupied' ? 'bg-landing-navy' : 'bg-landing-mint-deep'}`}></div>
                      {property.statusLabel}
                    </div>
                    
                    <Link 
                      href={`/dashboard/properties/${property.id}`} 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-landing-ink-mute hover:text-landing-navy hover:bg-landing-bg-deep transition-all"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="bg-white border border-landing-rule-soft rounded-[18px] shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-landing-rule-soft">
            <h3 className="font-semibold text-[15px] text-landing-ink tracking-tight">Actividad reciente</h3>
            <p className="text-[12px] text-landing-ink-mute mt-0.5">Últimos eventos en tus propiedades</p>
          </div>
          
          <div className="flex-1 p-6 space-y-0 divide-y divide-dashed divide-landing-rule-soft">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                  activity.color === "navy" && "bg-landing-navy-tint text-landing-navy",
                  activity.color === "mint" && "bg-landing-mint-tint text-landing-mint-deep",
                  activity.color === "amber" && "bg-landing-amber-tint text-landing-amber",
                )}>
                  <activity.icon className="h-3.5 w-3.5 stroke-[1.75]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-[13px] text-landing-ink leading-snug mb-1"
                    dangerouslySetInnerHTML={{ __html: activity.message }}
                  />
                  <span className="font-jetbrains text-[10px] text-landing-ink-mute tracking-wide uppercase">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-landing-bg-deep/30 border-t border-landing-rule-soft text-center">
            <button className="font-jetbrains text-[10px] font-bold text-landing-navy uppercase tracking-widest hover:underline transition-all">
              Ver historial completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
