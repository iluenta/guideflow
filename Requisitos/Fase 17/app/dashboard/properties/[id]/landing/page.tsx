"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  Save,
  Palette,
  Type,
  ImageIcon,
  Calendar,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Waves,
  UtensilsCrossed,
  Dumbbell,
  Globe,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const propertyData = {
  1: {
    name: "Apartamento Centro Madrid",
    location: "Madrid, Centro",
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    pricePerNight: 85,
  },
  2: {
    name: "Casa Rural Asturias",
    location: "Ribadesella, Asturias",
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    pricePerNight: 120,
  },
  3: {
    name: "Estudio Playa Valencia",
    location: "Valencia, Malvarrosa",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 65,
  },
};

const amenityOptions = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "coffee", label: "Cafetera", icon: Coffee },
  { id: "tv", label: "Smart TV", icon: Tv },
  { id: "ac", label: "Aire acondicionado", icon: Wind },
  { id: "pool", label: "Piscina", icon: Waves },
  { id: "kitchen", label: "Cocina equipada", icon: UtensilsCrossed },
  { id: "gym", label: "Gimnasio", icon: Dumbbell },
];

const colorThemes = [
  { id: "terracotta", name: "Terracota", primary: "#c75d3a", secondary: "#f5ebe0" },
  { id: "ocean", name: "Oceano", primary: "#2563eb", secondary: "#eff6ff" },
  { id: "forest", name: "Bosque", primary: "#16a34a", secondary: "#f0fdf4" },
  { id: "sunset", name: "Atardecer", primary: "#ea580c", secondary: "#fff7ed" },
  { id: "lavender", name: "Lavanda", primary: "#7c3aed", secondary: "#faf5ff" },
];

export default function LandingEditorPage() {
  const params = useParams();
  const propertyId = Number(params.id);
  const property = propertyData[propertyId as keyof typeof propertyData] || propertyData[1];

  const [mounted, setMounted] = useState(false);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [landingConfig, setLandingConfig] = useState({
    enabled: true,
    slug: "apartamento-centro-madrid",
    theme: "terracotta",
    heroTitle: `Bienvenido a ${property.name}`,
    heroSubtitle: "Tu hogar lejos de casa en el corazon de la ciudad",
    description: "Disfruta de una estancia inolvidable en nuestro acogedor apartamento, perfectamente ubicado para explorar lo mejor de la ciudad. Con todas las comodidades que necesitas para sentirte como en casa.",
    amenities: ["wifi", "parking", "coffee", "tv", "ac", "kitchen"],
    showCalendar: true,
    showPricing: true,
    showLocation: true,
    showReviews: true,
    ctaText: "Reservar ahora",
    contactEmail: "reservas@ejemplo.com",
    contactPhone: "+34 600 123 456",
    policies: {
      checkIn: "15:00",
      checkOut: "11:00",
      cancellation: "Cancelacion gratuita hasta 48h antes",
      minStay: 2,
    },
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b25ba?w=800&h=600&fit=crop",
    ],
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const publicUrl = `/p/${landingConfig.slug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editor de Landing</h1>
            <p className="text-sm text-muted-foreground">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={publicUrl} target="_blank">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>
          </Link>
          <Button onClick={handleSave} className="gap-2">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Guardado" : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {/* URL publica */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Globe className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">URL publica de tu landing</p>
              <p className="text-sm text-muted-foreground">hostguide.app{publicUrl}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 bg-transparent">
              <Copy className="h-3 w-3" />
              Copiar
            </Button>
            <Link href={publicUrl} target="_blank">
              <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                <ExternalLink className="h-3 w-3" />
                Abrir
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          {!mounted ? (
            <div className="w-full h-96 bg-slate-50 animate-pulse rounded-xl" />
          ) : (
            <Tabs id={id} defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">
                  <Type className="mr-2 h-4 w-4 hidden sm:inline" />
                  Contenido
                </TabsTrigger>
                <TabsTrigger value="design">
                  <Palette className="mr-2 h-4 w-4 hidden sm:inline" />
                  Diseno
                </TabsTrigger>
                <TabsTrigger value="gallery">
                  <ImageIcon className="mr-2 h-4 w-4 hidden sm:inline" />
                  Galeria
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Calendar className="mr-2 h-4 w-4 hidden sm:inline" />
                  Ajustes
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Textos principales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL personalizada</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">hostguide.app/p/</span>
                        <Input
                          id="slug"
                          value={landingConfig.slug}
                          onChange={(e) => setLandingConfig({ ...landingConfig, slug: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Titulo principal</Label>
                      <Input
                        id="heroTitle"
                        value={landingConfig.heroTitle}
                        onChange={(e) => setLandingConfig({ ...landingConfig, heroTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroSubtitle">Subtitulo</Label>
                      <Input
                        id="heroSubtitle"
                        value={landingConfig.heroSubtitle}
                        onChange={(e) => setLandingConfig({ ...landingConfig, heroSubtitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripcion</Label>
                      <Textarea
                        id="description"
                        value={landingConfig.description}
                        onChange={(e) => setLandingConfig({ ...landingConfig, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ctaText">Texto del boton</Label>
                      <Input
                        id="ctaText"
                        value={landingConfig.ctaText}
                        onChange={(e) => setLandingConfig({ ...landingConfig, ctaText: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Amenities</CardTitle>
                    <CardDescription>Selecciona los servicios disponibles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {amenityOptions.map((amenity) => {
                        const isSelected = landingConfig.amenities.includes(amenity.id);
                        return (
                          <button
                            key={amenity.id}
                            onClick={() => {
                              if (isSelected) {
                                setLandingConfig({
                                  ...landingConfig,
                                  amenities: landingConfig.amenities.filter((a) => a !== amenity.id),
                                });
                              } else {
                                setLandingConfig({
                                  ...landingConfig,
                                  amenities: [...landingConfig.amenities, amenity.id],
                                });
                              }
                            }}
                            className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${isSelected
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border text-muted-foreground hover:border-primary/50"
                              }`}
                          >
                            <amenity.icon className="h-4 w-4" />
                            {amenity.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de contacto</Label>
                      <Input
                        id="email"
                        type="email"
                        value={landingConfig.contactEmail}
                        onChange={(e) => setLandingConfig({ ...landingConfig, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={landingConfig.contactPhone}
                        onChange={(e) => setLandingConfig({ ...landingConfig, contactPhone: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Design Tab */}
              <TabsContent value="design" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tema de colores</CardTitle>
                    <CardDescription>Elige un esquema de colores para tu landing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {colorThemes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setLandingConfig({ ...landingConfig, theme: theme.id })}
                          className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${landingConfig.theme === theme.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="flex gap-1">
                            <div
                              className="h-6 w-6 rounded-full"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="h-6 w-6 rounded-full border"
                              style={{ backgroundColor: theme.secondary }}
                            />
                          </div>
                          <span className="text-sm font-medium">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Secciones visibles</CardTitle>
                    <CardDescription>Activa o desactiva secciones de la landing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showCalendar">Calendario de disponibilidad</Label>
                      <Switch
                        id="showCalendar"
                        checked={landingConfig.showCalendar}
                        onCheckedChange={(checked) => setLandingConfig({ ...landingConfig, showCalendar: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showPricing">Precios y tarifas</Label>
                      <Switch
                        id="showPricing"
                        checked={landingConfig.showPricing}
                        onCheckedChange={(checked) => setLandingConfig({ ...landingConfig, showPricing: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showLocation">Mapa de ubicacion</Label>
                      <Switch
                        id="showLocation"
                        checked={landingConfig.showLocation}
                        onCheckedChange={(checked) => setLandingConfig({ ...landingConfig, showLocation: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showReviews">Resenas de huespedes</Label>
                      <Switch
                        id="showReviews"
                        checked={landingConfig.showReviews}
                        onCheckedChange={(checked) => setLandingConfig({ ...landingConfig, showReviews: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Galeria de imagenes</CardTitle>
                    <CardDescription>Sube hasta 10 fotos de tu alojamiento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {landingConfig.gallery.map((image, index) => (
                        <div key={index} className="group relative aspect-video overflow-hidden rounded-lg">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Foto ${index + 1}`}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="secondary" size="sm">
                              Cambiar
                            </Button>
                          </div>
                        </div>
                      ))}
                      <button className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-6 w-6" />
                          <span className="mt-1 block text-xs">Anadir foto</span>
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Politicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkIn">Hora de entrada</Label>
                        <Select
                          value={landingConfig.policies.checkIn}
                          onValueChange={(value) =>
                            setLandingConfig({
                              ...landingConfig,
                              policies: { ...landingConfig.policies, checkIn: value },
                            })
                          }
                        >
                          <SelectTrigger id="checkIn">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkOut">Hora de salida</Label>
                        <Select
                          value={landingConfig.policies.checkOut}
                          onValueChange={(value) =>
                            setLandingConfig({
                              ...landingConfig,
                              policies: { ...landingConfig.policies, checkOut: value },
                            })
                          }
                        >
                          <SelectTrigger id="checkOut">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["09:00", "10:00", "11:00", "12:00"].map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStay">Estancia minima (noches)</Label>
                      <Input
                        id="minStay"
                        type="number"
                        value={landingConfig.policies.minStay}
                        onChange={(e) =>
                          setLandingConfig({
                            ...landingConfig,
                            policies: { ...landingConfig.policies, minStay: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cancellation">Politica de cancelacion</Label>
                      <Textarea
                        id="cancellation"
                        value={landingConfig.policies.cancellation}
                        onChange={(e) =>
                          setLandingConfig({
                            ...landingConfig,
                            policies: { ...landingConfig.policies, cancellation: e.target.value },
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estado de la landing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Landing activa</p>
                        <p className="text-sm text-muted-foreground">
                          Tu landing sera visible en la URL publica
                        </p>
                      </div>
                      <Switch
                        checked={landingConfig.enabled}
                        onCheckedChange={(checked) => setLandingConfig({ ...landingConfig, enabled: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Vista previa</h2>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`rounded-md p-2 ${previewMode === "mobile" ? "bg-muted" : ""}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`rounded-md p-2 ${previewMode === "desktop" ? "bg-muted" : ""}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className={`mx-auto overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all ${previewMode === "mobile" ? "max-w-[375px]" : "w-full"
              }`}
          >
            <div className="h-[600px] overflow-y-auto">
              <LandingPreview config={landingConfig} property={property} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPreview({
  config,
  property,
}: {
  config: {
    heroTitle: string;
    heroSubtitle: string;
    description: string;
    amenities: string[];
    ctaText: string;
    gallery: string[];
    theme: string;
    showCalendar: boolean;
    showPricing: boolean;
    policies: {
      checkIn: string;
      checkOut: string;
      minStay: number;
    };
  };
  property: {
    name: string;
    location: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    pricePerNight: number;
  };
}) {
  const theme = colorThemes.find((t) => t.id === config.theme) || colorThemes[0];

  return (
    <div className="min-h-full" style={{ backgroundColor: theme.secondary }}>
      {/* Hero */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={config.gallery[0] || "/placeholder.svg"}
          alt={property.name}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h1 className="text-xl font-bold">{config.heroTitle}</h1>
          <p className="mt-1 text-sm opacity-90">{config.heroSubtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Quick info */}
        <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4" style={{ color: theme.primary }} />
            {property.location}
          </div>
          {config.showPricing && (
            <div className="text-right">
              <span className="text-lg font-bold" style={{ color: theme.primary }}>
                {property.pricePerNight}€
              </span>
              <span className="text-xs text-gray-500">/noche</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold" style={{ color: theme.primary }}>
            Sobre el alojamiento
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{config.description}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span>{property.bedrooms} hab.</span>
            <span>{property.bathrooms} banos</span>
            <span>{property.maxGuests} huespedes</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold" style={{ color: theme.primary }}>
            Servicios incluidos
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {config.amenities.slice(0, 6).map((amenityId) => {
              const amenity = amenityOptions.find((a) => a.id === amenityId);
              if (!amenity) return null;
              return (
                <div key={amenityId} className="flex items-center gap-2 text-sm text-gray-600">
                  <amenity.icon className="h-4 w-4" style={{ color: theme.primary }} />
                  {amenity.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Policies */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold" style={{ color: theme.primary }}>
            Informacion importante
          </h2>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Check-in</span>
              <span className="font-medium">{config.policies.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out</span>
              <span className="font-medium">{config.policies.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>Estancia minima</span>
              <span className="font-medium">{config.policies.minStay} noches</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="w-full rounded-lg py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: theme.primary }}
        >
          {config.ctaText}
        </button>
      </div>
    </div>
  );
}
