"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const stats = [
  {
    name: "Reservas este mes",
    value: "12",
    change: "+23%",
    trend: "up",
    icon: Calendar,
  },
  {
    name: "Ocupacion",
    value: "78%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    name: "Huespedes activos",
    value: "4",
    change: "0",
    trend: "neutral",
    icon: Users,
  },
  {
    name: "Ingresos del mes",
    value: "2.450",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
  },
];

const properties = [
  {
    id: 1,
    name: "Apartamento Centro Madrid",
    status: "occupied",
    guest: "Carlos Martinez",
    checkOut: "28 Ene",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Casa Rural Asturias",
    status: "available",
    guest: null,
    checkOut: null,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Estudio Playa Valencia",
    status: "occupied",
    guest: "Ana Garcia",
    checkOut: "25 Ene",
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
    type: "guide",
    message: "Consulta IA: WiFi password - Casa Rural",
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
    type: "booking",
    message: "Reserva confirmada para 15-18 Feb",
    time: "Ayer",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Buenos dias, Usuario
          </h1>
          <p className="mt-1 text-muted-foreground">
            Aqui tienes un resumen de tus alojamientos
          </p>
        </div>
        <Link href="/dashboard/properties">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                {stat.trend === "up" && (
                  <Badge
                    variant="secondary"
                    className="bg-accent/10 text-accent"
                  >
                    {stat.change}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {stat.name === "Ingresos del mes" && "€"}
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties and Activity */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Properties */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tus propiedades</CardTitle>
              <Link href="/dashboard/properties">
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver todas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <img
                      src={property.image || "/placeholder.svg"}
                      alt={property.name}
                      className="h-20 w-full rounded-lg object-cover sm:h-16 sm:w-24"
                      crossOrigin="anonymous"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">
                          {property.name}
                        </h3>
                        <Badge
                          variant={
                            property.status === "occupied"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            property.status === "occupied"
                              ? "bg-accent text-accent-foreground"
                              : ""
                          }
                        >
                          {property.status === "occupied"
                            ? "Ocupado"
                            : "Disponible"}
                        </Badge>
                      </div>
                      {property.guest && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {property.guest} - Check-out: {property.checkOut}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href="/guide/demo">
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <ExternalLink className="h-3 w-3" />
                          Guia
                        </Button>
                      </Link>
                      <Link href="/dashboard/calendar">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        activity.type === "booking"
                          ? "bg-primary"
                          : activity.type === "guide"
                            ? "bg-accent"
                            : "bg-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {activity.message}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/properties">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-6 bg-transparent"
              >
                <Building2 className="h-6 w-6 text-primary" />
                <span>Gestionar propiedades</span>
              </Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-6 bg-transparent"
              >
                <Calendar className="h-6 w-6 text-primary" />
                <span>Ver calendario</span>
              </Button>
            </Link>
            <Link href="/dashboard/guides">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-6 bg-transparent"
              >
                <Users className="h-6 w-6 text-primary" />
                <span>Editar guias</span>
              </Button>
            </Link>
            <Link href="/guide/demo">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-6 bg-transparent"
              >
                <ExternalLink className="h-6 w-6 text-primary" />
                <span>Vista huesped</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
