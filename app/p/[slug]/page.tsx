"use client";

import React from "react"

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MapPin,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  UtensilsCrossed,
  Star,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Users,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Share2,
  Heart,
  Check,
  Clock,
  X,
  MessageCircle,
} from "lucide-react";
import { addDays, format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  coffee: Coffee,
  tv: Tv,
  ac: Wind,
  kitchen: UtensilsCrossed,
};

const propertyData: Record<string, {
  name: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  amenities: string[];
  gallery: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    minStay: number;
  };
  reviews: {
    name: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  contactEmail: string;
  contactPhone: string;
  coordinates: { lat: number; lng: number };
}> = {
  "apartamento-centro-madrid": {
    name: "Apartamento Centro Madrid",
    location: "Madrid, Centro",
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    pricePerNight: 85,
    heroTitle: "Bienvenido a tu hogar en Madrid",
    heroSubtitle: "El corazon de la ciudad a tus pies",
    description: "Disfruta de una estancia inolvidable en nuestro acogedor apartamento de 80m2, perfectamente ubicado en el corazon de Madrid. A solo 5 minutos andando de la Puerta del Sol y Gran Via, tendras acceso a los mejores restaurantes, tiendas y atracciones de la ciudad. El apartamento cuenta con todas las comodidades modernas manteniendo el encanto de un edificio historico renovado.",
    amenities: ["wifi", "parking", "coffee", "tv", "ac", "kitchen"],
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b25ba?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200&h=800&fit=crop",
    ],
    policies: {
      checkIn: "15:00",
      checkOut: "11:00",
      cancellation: "Cancelacion gratuita hasta 48 horas antes de la llegada. Despues se cobrara el 50% de la primera noche.",
      minStay: 2,
    },
    reviews: [
      {
        name: "Maria G.",
        rating: 5,
        comment: "Apartamento increible, muy bien ubicado y con todo lo necesario. El anfitrion muy atento. Repetiremos seguro!",
        date: "Enero 2026",
      },
      {
        name: "Carlos R.",
        rating: 5,
        comment: "Perfecto para una escapada a Madrid. Limpio, comodo y en una zona inmejorable.",
        date: "Diciembre 2025",
      },
      {
        name: "Laura M.",
        rating: 4,
        comment: "Muy buena experiencia. El unico pero es que el parking esta a 200m, pero el anfitrion nos aviso antes.",
        date: "Noviembre 2025",
      },
    ],
    contactEmail: "reservas@apartamentocentromadrid.com",
    contactPhone: "+34 600 123 456",
    coordinates: { lat: 40.4168, lng: -3.7038 },
  },
};

// Dates already booked (demo)
const bookedDates = [
  { from: new Date(2026, 0, 25), to: new Date(2026, 0, 28) },
  { from: new Date(2026, 1, 5), to: new Date(2026, 1, 10) },
  { from: new Date(2026, 1, 14), to: new Date(2026, 1, 16) },
];

export default function PublicLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const property = propertyData[slug] || propertyData["apartamento-centro-madrid"];

  const [currentImage, setCurrentImage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), 7),
    to: addDays(new Date(), 10),
  });
  const [guests, setGuests] = useState(2);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [liked, setLiked] = useState(false);

  const nights = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) 
    : 0;
  const subtotal = nights * property.pricePerNight;
  const cleaningFee = 35;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + cleaningFee + serviceFee;

  const isDateDisabled = (date: Date) => {
    return bookedDates.some(
      (range) => date >= range.from && date <= range.to
    );
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % property.gallery.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + property.gallery.length) % property.gallery.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
        <span className="text-lg font-semibold text-foreground">
          {property.name}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLiked(!liked)}
            className={liked ? "text-red-500" : ""}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Gallery */}
      <section className="relative">
        <div className="relative h-64 overflow-hidden md:h-[60vh]">
          <img
            src={property.gallery[currentImage] || "/placeholder.svg"}
            alt={`${property.name} - Foto ${currentImage + 1}`}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg transition-colors hover:bg-card"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg transition-colors hover:bg-card"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {property.gallery.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentImage ? "bg-primary-foreground" : "bg-primary-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop gallery grid */}
        <div className="mx-auto hidden max-w-7xl gap-2 px-4 py-4 md:grid md:grid-cols-4">
          {property.gallery.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`relative aspect-video overflow-hidden rounded-lg ${
                index === currentImage ? "ring-2 ring-primary" : ""
              }`}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`Foto ${index + 1}`}
                className="h-full w-full object-cover transition-transform hover:scale-105"
                crossOrigin="anonymous"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground md:text-3xl text-balance">
                    {property.heroTitle}
                  </h1>
                  <p className="mt-1 text-muted-foreground">{property.heroSubtitle}</p>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLiked(!liked)}
                    className={`bg-transparent ${liked ? "text-red-500" : ""}`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="bg-transparent">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  {property.location}
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms} habitaciones
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms} banos
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Hasta {property.maxGuests} huespedes
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">4.9</span>
              </div>
              <span className="text-muted-foreground">
                ({property.reviews.length} resenas)
              </span>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre el alojamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios incluidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {property.amenities.map((amenityId) => {
                    const Icon = amenityIcons[amenityId] || Wifi;
                    const labels: Record<string, string> = {
                      wifi: "WiFi de alta velocidad",
                      parking: "Parking privado",
                      coffee: "Cafetera Nespresso",
                      tv: "Smart TV 55\"",
                      ac: "Aire acondicionado",
                      kitchen: "Cocina equipada",
                    };
                    return (
                      <div
                        key={amenityId}
                        className="flex items-center gap-3 text-foreground"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm">{labels[amenityId] || amenityId}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    disabled={(date) => date < new Date() || isDateDisabled(date)}
                    locale={es}
                    className="rounded-md border"
                  />
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <span className="text-muted-foreground">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/20" />
                    <span className="text-muted-foreground">Ocupado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Politicas del alojamiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Horarios</p>
                    <p className="text-sm text-muted-foreground">
                      Check-in: {property.policies.checkIn} | Check-out: {property.policies.checkOut}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarIcon className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Estancia minima</p>
                    <p className="text-sm text-muted-foreground">
                      {property.policies.minStay} noches
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Cancelacion</p>
                    <p className="text-sm text-muted-foreground">
                      {property.policies.cancellation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  4.9 - {property.reviews.length} resenas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {property.reviews.map((review, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="font-medium text-primary">
                              {review.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contactar con el anfitrion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                    <Phone className="h-4 w-4" />
                    {property.contactPhone}
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                    <Mail className="h-4 w-4" />
                    Enviar mensaje
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Card (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-foreground">
                        {property.pricePerNight}€
                      </span>
                      <span className="text-muted-foreground"> /noche</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border">
                      <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-3">
                          <Label className="text-xs text-muted-foreground">LLEGADA</Label>
                          <p className="mt-1 text-sm font-medium">
                            {dateRange?.from
                              ? format(dateRange.from, "d MMM yyyy", { locale: es })
                              : "Seleccionar"}
                          </p>
                        </div>
                        <div className="p-3">
                          <Label className="text-xs text-muted-foreground">SALIDA</Label>
                          <p className="mt-1 text-sm font-medium">
                            {dateRange?.to
                              ? format(dateRange.to, "d MMM yyyy", { locale: es })
                              : "Seleccionar"}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-border p-3">
                        <Label className="text-xs text-muted-foreground">HUESPEDES</Label>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{guests} huespedes</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => setGuests(Math.max(1, guests - 1))}
                            >
                              -
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => setGuests(Math.min(property.maxGuests, guests + 1))}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          Reservar ahora
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {bookingStep === 1 ? "Confirmar reserva" : "Datos de contacto"}
                          </DialogTitle>
                          <DialogDescription>
                            {bookingStep === 1
                              ? "Revisa los detalles de tu estancia"
                              : "Introduce tus datos para completar la reserva"}
                          </DialogDescription>
                        </DialogHeader>
                        {bookingStep === 1 ? (
                          <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {property.pricePerNight}€ x {nights} noches
                                </span>
                                <span>{subtotal}€</span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Limpieza</span>
                                <span>{cleaningFee}€</span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Tarifa de servicio</span>
                                <span>{serviceFee}€</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-semibold">
                                <span>Total</span>
                                <span>{total}€</span>
                              </div>
                            </div>
                            <Button className="w-full" onClick={() => setBookingStep(2)}>
                              Continuar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Nombre completo</Label>
                              <Input id="name" placeholder="Juan Garcia" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" type="email" placeholder="juan@ejemplo.com" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Telefono</Label>
                              <Input id="phone" type="tel" placeholder="+34 600 000 000" />
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => {
                                setBookingOpen(false);
                                setBookingStep(1);
                              }}
                            >
                              Confirmar reserva ({total}€)
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {nights > 0 && (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground underline">
                            {property.pricePerNight}€ x {nights} noches
                          </span>
                          <span>{subtotal}€</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground underline">
                            Limpieza
                          </span>
                          <span>{cleaningFee}€</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground underline">
                            Tarifa de servicio
                          </span>
                          <span>{serviceFee}€</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                          <span>Total</span>
                          <span>{total}€</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    No se te cobrara nada todavia
                  </p>
                </CardContent>
              </Card>

              {/* Quick contact */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Tienes alguna pregunta?
                  </p>
                  <Button variant="outline" className="mt-2 w-full gap-2 bg-transparent">
                    <MessageCircle className="h-4 w-4" />
                    Contactar anfitrion
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">
                {property.pricePerNight}€
              </span>
              <span className="text-sm text-muted-foreground">/noche</span>
            </div>
            {nights > 0 && (
              <p className="text-xs text-muted-foreground">
                {nights} noches - {total}€ total
              </p>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Reservar</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Completa tu reserva</SheetTitle>
                <SheetDescription>
                  Selecciona fechas y confirma tu estancia
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6 overflow-y-auto pb-20">
                <div>
                  <Label className="text-sm font-medium">Fechas</Label>
                  <div className="mt-2 flex justify-center">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      disabled={(date) => date < new Date() || isDateDisabled(date)}
                      locale={es}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Huespedes</Label>
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-border p-3">
                    <span>{guests} huespedes</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                      >
                        -
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setGuests(Math.min(property.maxGuests, guests + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {property.pricePerNight}€ x {nights} noches
                      </span>
                      <span>{subtotal}€</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Limpieza</span>
                      <span>{cleaningFee}€</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tarifa de servicio</span>
                      <span>{serviceFee}€</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                      <span>Total</span>
                      <span>{total}€</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-name">Nombre completo</Label>
                    <Input id="mobile-name" placeholder="Juan Garcia" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-email">Email</Label>
                    <Input id="mobile-email" type="email" placeholder="juan@ejemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-phone">Telefono</Label>
                    <Input id="mobile-phone" type="tel" placeholder="+34 600 000 000" />
                  </div>
                </div>

                <Button className="w-full" size="lg" disabled={nights === 0}>
                  Confirmar reserva {nights > 0 && `(${total}€)`}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
