"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const properties = [
  { id: "all", name: "Todas las propiedades" },
  { id: "1", name: "Apartamento Centro Madrid" },
  { id: "2", name: "Casa Rural Asturias" },
  { id: "3", name: "Estudio Playa Valencia" },
];

const bookings = [
  {
    id: 1,
    propertyId: "1",
    propertyName: "Apt. Madrid",
    guest: "Carlos Martinez",
    startDay: 15,
    endDay: 20,
    color: "bg-primary",
  },
  {
    id: 2,
    propertyId: "2",
    propertyName: "Casa Asturias",
    guest: "Laura Sanchez",
    startDay: 22,
    endDay: 28,
    color: "bg-accent",
  },
  {
    id: 3,
    propertyId: "3",
    propertyName: "Estudio Valencia",
    guest: "Ana Garcia",
    startDay: 10,
    endDay: 15,
    color: "bg-chart-3",
  },
  {
    id: 4,
    propertyId: "1",
    propertyName: "Apt. Madrid",
    guest: "Pedro Lopez",
    startDay: 25,
    endDay: 31,
    color: "bg-primary",
  },
];

const daysOfWeek = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 22));
  const [selectedProperty, setSelectedProperty] = useState("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const filteredBookings =
    selectedProperty === "all"
      ? bookings
      : bookings.filter((b) => b.propertyId === selectedProperty);

  const getBookingsForDay = (day: number) => {
    return filteredBookings.filter((b) => day >= b.startDay && day <= b.endDay);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Calendario
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona disponibilidad y reservas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Bloquear fechas</span>
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            {months[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-border">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayBookings = day ? getBookingsForDay(day) : [];
              const isToday = day === 22 && month === 0 && year === 2026;

              return (
                <div
                  key={index}
                  className={`min-h-[80px] border-b border-r border-border p-1 sm:min-h-[100px] sm:p-2 ${
                    index % 7 === 0 ? "border-l" : ""
                  } ${!day ? "bg-muted/30" : "hover:bg-muted/50"}`}
                >
                  {day && (
                    <>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className={`${booking.color} truncate rounded px-1 py-0.5 text-xs text-primary-foreground`}
                          >
                            <span className="hidden sm:inline">
                              {booking.guest}
                            </span>
                            <span className="sm:hidden">
                              {booking.propertyName}
                            </span>
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{dayBookings.length - 2} mas
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proximas reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${booking.color}`} />
                  <div>
                    <p className="font-medium text-foreground">
                      {booking.guest}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.propertyName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {booking.startDay} - {booking.endDay} Ene
                  </Badge>
                  <Button variant="outline" size="sm">
                    Ver detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
