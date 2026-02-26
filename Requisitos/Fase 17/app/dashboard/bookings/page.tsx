"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MoreVertical,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  MessageSquare,
  X,
  Check,
  Clock,
  Ban,
  FileText,
  Send,
  Euro,
  Users,
  Bed,
  CalendarDays,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "blocked";

interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  cleaningFee: number;
  totalPrice: number;
  status: BookingStatus;
  source: string;
  notes: string;
  createdAt: string;
  paymentStatus: "paid" | "pending" | "refunded" | "partial";
}

const bookings: Booking[] = [
  {
    id: "RES-2026-001",
    propertyId: "1",
    propertyName: "Apartamento Centro Madrid",
    propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    guestName: "Carlos Martinez",
    guestEmail: "carlos.martinez@email.com",
    guestPhone: "+34 612 345 678",
    guests: 2,
    checkIn: "2026-01-15",
    checkOut: "2026-01-20",
    nights: 5,
    pricePerNight: 85,
    cleaningFee: 40,
    totalPrice: 465,
    status: "confirmed",
    source: "Airbnb",
    notes: "Llegada tardia prevista (22:00). Necesitan cuna para bebe.",
    createdAt: "2026-01-10",
    paymentStatus: "paid",
  },
  {
    id: "RES-2026-002",
    propertyId: "2",
    propertyName: "Casa Rural Asturias",
    propertyImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
    guestName: "Laura Sanchez",
    guestEmail: "laura.sanchez@email.com",
    guestPhone: "+34 623 456 789",
    guests: 4,
    checkIn: "2026-01-22",
    checkOut: "2026-01-28",
    nights: 6,
    pricePerNight: 120,
    cleaningFee: 60,
    totalPrice: 780,
    status: "confirmed",
    source: "Booking.com",
    notes: "Familia con 2 ninos. Preguntan por actividades en la zona.",
    createdAt: "2026-01-08",
    paymentStatus: "paid",
  },
  {
    id: "RES-2026-003",
    propertyId: "3",
    propertyName: "Estudio Playa Valencia",
    propertyImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    guestName: "Ana Garcia",
    guestEmail: "ana.garcia@email.com",
    guestPhone: "+34 634 567 890",
    guests: 2,
    checkIn: "2026-01-10",
    checkOut: "2026-01-15",
    nights: 5,
    pricePerNight: 65,
    cleaningFee: 30,
    totalPrice: 355,
    status: "completed",
    source: "Directo",
    notes: "",
    createdAt: "2026-01-02",
    paymentStatus: "paid",
  },
  {
    id: "RES-2026-004",
    propertyId: "1",
    propertyName: "Apartamento Centro Madrid",
    propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    guestName: "Pedro Lopez",
    guestEmail: "pedro.lopez@email.com",
    guestPhone: "+34 645 678 901",
    guests: 3,
    checkIn: "2026-01-25",
    checkOut: "2026-01-31",
    nights: 6,
    pricePerNight: 85,
    cleaningFee: 40,
    totalPrice: 550,
    status: "pending",
    source: "Landing",
    notes: "Pendiente de confirmacion de pago.",
    createdAt: "2026-01-20",
    paymentStatus: "pending",
  },
  {
    id: "RES-2026-005",
    propertyId: "2",
    propertyName: "Casa Rural Asturias",
    propertyImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
    guestName: "Maria Fernandez",
    guestEmail: "maria.fernandez@email.com",
    guestPhone: "+34 656 789 012",
    guests: 6,
    checkIn: "2026-02-05",
    checkOut: "2026-02-10",
    nights: 5,
    pricePerNight: 120,
    cleaningFee: 60,
    totalPrice: 660,
    status: "cancelled",
    source: "Airbnb",
    notes: "Cancelado por el huesped. Motivo: cambio de planes.",
    createdAt: "2026-01-15",
    paymentStatus: "refunded",
  },
  {
    id: "BLK-2026-001",
    propertyId: "3",
    propertyName: "Estudio Playa Valencia",
    propertyImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    guestName: "Bloqueo - Mantenimiento",
    guestEmail: "",
    guestPhone: "",
    guests: 0,
    checkIn: "2026-01-18",
    checkOut: "2026-01-20",
    nights: 2,
    pricePerNight: 0,
    cleaningFee: 0,
    totalPrice: 0,
    status: "blocked",
    source: "Manual",
    notes: "Reparacion aire acondicionado",
    createdAt: "2026-01-16",
    paymentStatus: "paid",
  },
];

const properties = [
  { id: "all", name: "Todas las propiedades" },
  { id: "1", name: "Apartamento Centro Madrid" },
  { id: "2", name: "Casa Rural Asturias" },
  { id: "3", name: "Estudio Playa Valencia" },
];

const getStatusConfig = (status: BookingStatus) => {
  const configs = {
    confirmed: { label: "Confirmada", variant: "default" as const, color: "bg-green-500", icon: Check },
    pending: { label: "Pendiente", variant: "secondary" as const, color: "bg-amber-500", icon: Clock },
    cancelled: { label: "Cancelada", variant: "destructive" as const, color: "bg-red-500", icon: X },
    completed: { label: "Completada", variant: "outline" as const, color: "bg-gray-500", icon: Check },
    blocked: { label: "Bloqueado", variant: "secondary" as const, color: "bg-gray-700", icon: Ban },
  };
  return configs[status];
};

const getPaymentStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    paid: { label: "Pagado", color: "text-green-600" },
    pending: { label: "Pendiente", color: "text-amber-600" },
    refunded: { label: "Reembolsado", color: "text-blue-600" },
    partial: { label: "Parcial", color: "text-orange-600" },
  };
  return configs[status] || configs.pending;
};

function BookingsPageContent() {
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [blockDatesOpen, setBlockDatesOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const id = useId();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesProperty = selectedProperty === "all" || booking.propertyId === selectedProperty;
    const matchesStatus = selectedStatus === "all" || booking.status === selectedStatus;
    const matchesSearch =
      booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProperty && matchesStatus && matchesSearch;
  });

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  };

  const stats = {
    total: bookings.filter(b => b.status !== "blocked").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending: bookings.filter(b => b.status === "pending").length,
    revenue: bookings.filter(b => b.status === "confirmed" || b.status === "completed").reduce((sum, b) => sum + b.totalPrice, 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Reservas</h1>
          <p className="mt-1 text-muted-foreground">Gestiona todas tus reservas y bloqueos</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={blockDatesOpen} onOpenChange={setBlockDatesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Ban className="h-4 w-4" />
                <span className="hidden sm:inline">Bloquear fechas</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bloquear fechas</DialogTitle>
                <DialogDescription>
                  Bloquea fechas para mantenimiento, uso personal u otros motivos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Propiedad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.filter(p => p.id !== "all").map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha inicio</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha fin</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="personal">Uso personal</SelectItem>
                      <SelectItem value="renovation">Reformas</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea placeholder="Detalles adicionales..." rows={3} />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" className="bg-transparent" onClick={() => setBlockDatesOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setBlockDatesOpen(false)}>Bloquear fechas</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva reserva</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva reserva manual</DialogTitle>
                <DialogDescription>
                  Crea una reserva para un huesped que ha contactado directamente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 pt-4 sm:grid-cols-2">
                <div className="space-y-4 sm:col-span-2">
                  <div className="space-y-2">
                    <Label>Propiedad</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.filter(p => p.id !== "all").map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha entrada</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha salida</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre del huesped</Label>
                  <Input placeholder="Nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input type="tel" placeholder="+34 600 000 000" />
                </div>
                <div className="space-y-2">
                  <Label>Numero de huespedes</Label>
                  <Input type="number" min={1} defaultValue={2} />
                </div>
                <div className="space-y-2">
                  <Label>Precio por noche</Label>
                  <Input type="number" placeholder="85" />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de limpieza</Label>
                  <Input type="number" placeholder="40" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notas</Label>
                  <Textarea placeholder="Informacion adicional sobre la reserva..." rows={3} />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" className="bg-transparent" onClick={() => setNewBookingOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setNewBookingOpen(false)}>Crear reserva</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total reservas</p>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Confirmadas</p>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.revenue.toLocaleString("es-ES")}€</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ID o propiedad..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-[180px]">
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {!mounted ? (
        <div className="w-full h-96 bg-slate-50 animate-pulse rounded-xl" />
      ) : (
        <Tabs id={id} defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">
              <Link href="/dashboard/calendar">Calendario</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">No hay reservas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No se encontraron reservas con los filtros seleccionados
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const paymentConfig = getPaymentStatusConfig(booking.paymentStatus);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Property Image */}
                        <div className="relative h-32 w-full shrink-0 lg:h-auto lg:w-40">
                          <img
                            src={booking.propertyImage || "/placeholder.svg"}
                            alt={booking.propertyName}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                          <div className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ${statusConfig.color} text-white`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        {/* Booking Info */}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                  {booking.status === "blocked" ? booking.guestName : booking.guestName}
                                </h3>
                                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                              </div>
                              <p className="mt-0.5 text-sm text-muted-foreground">{booking.propertyName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{booking.id}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openBookingDetails(booking)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  {booking.status !== "blocked" && booking.guestEmail && (
                                    <DropdownMenuItem>
                                      <Send className="mr-2 h-4 w-4" />
                                      Enviar mensaje
                                    </DropdownMenuItem>
                                  )}
                                  {booking.status !== "blocked" && (
                                    <DropdownMenuItem>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Enviar guia
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {(booking.status === "confirmed" || booking.status === "pending") && (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setCancelDialogOpen(true);
                                      }}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Cancelar reserva
                                    </DropdownMenuItem>
                                  )}
                                  {booking.status === "blocked" && (
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                      <X className="mr-2 h-4 w-4" />
                                      Eliminar bloqueo
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Bed className="h-4 w-4" />
                              <span>{booking.nights} noches</span>
                            </div>
                            {booking.status !== "blocked" && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{booking.guests} huespedes</span>
                              </div>
                            )}
                            {booking.source && (
                              <Badge variant="outline" className="text-xs">{booking.source}</Badge>
                            )}
                          </div>

                          {booking.notes && (
                            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                              {booking.notes}
                            </p>
                          )}

                          {booking.status !== "blocked" && (
                            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                              <div className="flex items-center gap-4">
                                {booking.guestPhone && (
                                  <a href={`tel:${booking.guestPhone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span className="hidden sm:inline">{booking.guestPhone}</span>
                                  </a>
                                )}
                                {booking.guestEmail && (
                                  <a href={`mailto:${booking.guestEmail}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span className="hidden sm:inline">{booking.guestEmail}</span>
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${paymentConfig.color}`}>
                                  {paymentConfig.label}
                                </span>
                                <span className="text-lg font-bold text-foreground">{booking.totalPrice}€</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedBooking.status === "blocked" ? "Bloqueo de fechas" : "Detalles de la reserva"}
                      <Badge variant={getStatusConfig(selectedBooking.status).variant}>
                        {getStatusConfig(selectedBooking.status).label}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>
                      {selectedBooking.id} - Creada el {formatDate(selectedBooking.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Property Info */}
                <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                  <img
                    src={selectedBooking.propertyImage || "/placeholder.svg"}
                    alt={selectedBooking.propertyName}
                    className="h-16 w-24 rounded-lg object-cover"
                    crossOrigin="anonymous"
                  />
                  <div>
                    <h4 className="font-medium text-foreground">{selectedBooking.propertyName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedBooking.checkIn)} - {formatDate(selectedBooking.checkOut)} ({selectedBooking.nights} noches)
                    </p>
                  </div>
                </div>

                {/* Guest Info */}
                {selectedBooking.status !== "blocked" && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Informacion del huesped</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre</p>
                          <p className="font-medium">{selectedBooking.guestName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Huespedes</p>
                          <p className="font-medium">{selectedBooking.guests}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedBooking.guestEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefono</p>
                          <p className="font-medium">{selectedBooking.guestPhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                {selectedBooking.status !== "blocked" && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Desglose del pago</h4>
                    <div className="rounded-lg border border-border p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {selectedBooking.pricePerNight}€ x {selectedBooking.nights} noches
                          </span>
                          <span>{selectedBooking.pricePerNight * selectedBooking.nights}€</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Limpieza</span>
                          <span>{selectedBooking.cleaningFee}€</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Total</span>
                            <span className="font-bold text-lg">{selectedBooking.totalPrice}€</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-muted-foreground">Estado</span>
                            <span className={`text-sm font-medium ${getPaymentStatusConfig(selectedBooking.paymentStatus).color}`}>
                              {getPaymentStatusConfig(selectedBooking.paymentStatus).label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Notas</h4>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {selectedBooking.status !== "blocked" && selectedBooking.guestEmail && (
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Send className="h-4 w-4" />
                      Enviar mensaje
                    </Button>
                  )}
                  {selectedBooking.status !== "blocked" && (
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <ExternalLink className="h-4 w-4" />
                      Enviar guia
                    </Button>
                  )}
                  {(selectedBooking.status === "confirmed" || selectedBooking.status === "pending") && (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        setDetailsOpen(false);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                      Cancelar reserva
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancelar reserva
            </DialogTitle>
            <DialogDescription>
              Esta a punto de cancelar la reserva de {selectedBooking?.guestName}. Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded-lg bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Si la reserva ya esta pagada, debera procesar el reembolso manualmente segun su politica de cancelacion.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Motivo de cancelacion</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest_request">Solicitud del huesped</SelectItem>
                  <SelectItem value="host_unavailable">Propiedad no disponible</SelectItem>
                  <SelectItem value="payment_issue">Problema con el pago</SelectItem>
                  <SelectItem value="violation">Violacion de normas</SelectItem>
                  <SelectItem value="other">Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea placeholder="Detalles sobre la cancelacion..." rows={3} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" className="bg-transparent" onClick={() => setCancelDialogOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={() => setCancelDialogOpen(false)}>
              Confirmar cancelacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Reservas</h1>
            <p className="mt-1 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <BookingsPageContent />
    </Suspense>
  );
}
