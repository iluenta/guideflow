"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, Percent } from "lucide-react";

const stats = [
  {
    name: "Ingresos totales",
    value: "€8.450",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
  },
  {
    name: "Ocupacion media",
    value: "78%",
    change: "+5%",
    trend: "up",
    icon: Percent,
  },
  {
    name: "Total reservas",
    value: "34",
    change: "+8",
    trend: "up",
    icon: Calendar,
  },
  {
    name: "Huespedes unicos",
    value: "89",
    change: "-3",
    trend: "down",
    icon: Users,
  },
];

const monthlyRevenue = [
  { month: "Ago", value: 2100 },
  { month: "Sep", value: 1800 },
  { month: "Oct", value: 2400 },
  { month: "Nov", value: 1600 },
  { month: "Dic", value: 3200 },
  { month: "Ene", value: 2450 },
];

const propertyPerformance = [
  {
    name: "Apartamento Centro Madrid",
    revenue: 3200,
    occupancy: 85,
    bookings: 14,
  },
  {
    name: "Casa Rural Asturias",
    revenue: 2800,
    occupancy: 72,
    bookings: 11,
  },
  {
    name: "Estudio Playa Valencia",
    revenue: 2450,
    occupancy: 78,
    bookings: 9,
  },
];

const topSources = [
  { name: "Reserva directa", percentage: 45, color: "bg-primary" },
  { name: "Airbnb", percentage: 30, color: "bg-accent" },
  { name: "Booking.com", percentage: 20, color: "bg-chart-3" },
  { name: "Otros", percentage: 5, color: "bg-muted-foreground" },
];

export default function AnalyticsPage() {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Analiticas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Rendimiento de tus alojamientos
          </p>
        </div>
        <Select defaultValue="6m">
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Ultimos 7 dias</SelectItem>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="6m">Ultimos 6 meses</SelectItem>
            <SelectItem value="1y">Ultimo ano</SelectItem>
          </SelectContent>
        </Select>
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
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-accent" : "text-destructive"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-2">
              {monthlyRevenue.map((item) => (
                <div
                  key={item.month}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                    style={{
                      height: `${(item.value / maxRevenue) * 180}px`,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fuentes de reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSources.map((source) => (
                <div key={source.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{source.name}</span>
                    <span className="text-muted-foreground">
                      {source.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${source.color} transition-all`}
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendimiento por propiedad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">
                    Propiedad
                  </th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">
                    Ingresos
                  </th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">
                    Ocupacion
                  </th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">
                    Reservas
                  </th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.map((property) => (
                  <tr
                    key={property.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-4 font-medium text-foreground">
                      {property.name}
                    </td>
                    <td className="py-4 text-right text-foreground">
                      €{property.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`${
                          property.occupancy >= 80
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {property.occupancy}%
                      </span>
                    </td>
                    <td className="py-4 text-right text-foreground">
                      {property.bookings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
