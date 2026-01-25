"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wifi,
  Key,
  Car,
  MapPin,
  UtensilsCrossed,
  Phone,
  Plus,
  ExternalLink,
  Edit,
  Copy,
  QrCode,
  MessageSquare,
  ShoppingBag,
  Landmark,
  Waves,
  TreePine,
  Music,
  Heart,
  Trash2,
  GripVertical,
  Star,
} from "lucide-react";

const guides = [
  {
    id: 1,
    propertyName: "Apartamento Centro Madrid",
    status: "published",
    lastUpdated: "Hace 2 dias",
    sections: 8,
    aiQueries: 156,
  },
  {
    id: 2,
    propertyName: "Casa Rural Asturias",
    status: "published",
    lastUpdated: "Hace 1 semana",
    sections: 10,
    aiQueries: 89,
  },
  {
    id: 3,
    propertyName: "Estudio Playa Valencia",
    status: "draft",
    lastUpdated: "Hace 3 dias",
    sections: 5,
    aiQueries: 0,
  },
];

const sectionTemplates = [
  { icon: Wifi, title: "WiFi y Conectividad", description: "Red y contrasena", category: "basico" },
  { icon: Key, title: "Acceso", description: "Llaves, codigos, check-in", category: "basico" },
  { icon: Car, title: "Parking", description: "Donde aparcar", category: "basico" },
  { icon: MapPin, title: "Ubicacion", description: "Como llegar", category: "basico" },
  { icon: Phone, title: "Emergencias", description: "Contactos utiles", category: "basico" },
  { icon: UtensilsCrossed, title: "Restaurantes", description: "Donde comer", category: "recomendaciones" },
  { icon: ShoppingBag, title: "Compras", description: "Supermercados y tiendas", category: "recomendaciones" },
  { icon: Landmark, title: "Cultura", description: "Museos y monumentos", category: "recomendaciones" },
  { icon: Waves, title: "Playas", description: "Playas y piscinas", category: "recomendaciones" },
  { icon: TreePine, title: "Naturaleza", description: "Parques y rutas", category: "recomendaciones" },
  { icon: Music, title: "Ocio", description: "Bares y vida nocturna", category: "recomendaciones" },
  { icon: Heart, title: "Experiencias", description: "Actividades unicas", category: "recomendaciones" },
];

interface Recommendation {
  id: string;
  name: string;
  category: string;
  description: string;
  distance?: string;
  priceRange?: string;
  tip?: string;
  rating?: number;
}

const demoRecommendations: Recommendation[] = [
  { id: "1", name: "La Barraca", category: "restaurantes", description: "Paella tradicional valenciana", distance: "5 min", priceRange: "€€€", tip: "Reserva con antelacion", rating: 4.8 },
  { id: "2", name: "Sobrino de Botin", category: "restaurantes", description: "Cochinillo y cordero asado", distance: "3 min", priceRange: "€€€€", tip: "El restaurante mas antiguo del mundo", rating: 4.6 },
  { id: "3", name: "Mercado San Miguel", category: "restaurantes", description: "Tapas y pinchos variados", distance: "4 min", priceRange: "€€", tip: "Perfecto para probar de todo", rating: 4.5 },
  { id: "4", name: "Casa Labra", category: "restaurantes", description: "Tapas tradicionales", distance: "6 min", priceRange: "€", tip: "Las mejores croquetas de Madrid", rating: 4.7 },
  { id: "5", name: "Mercadona", category: "compras", description: "Supermercado grande", distance: "7 min", tip: "Abierto hasta 21:30" },
  { id: "6", name: "Carrefour Express", category: "compras", description: "Supermercado 24h", distance: "2 min", tip: "Para compras rapidas" },
  { id: "7", name: "El Corte Ingles", category: "compras", description: "Grandes almacenes", distance: "10 min", tip: "Planta gourmet excelente" },
  { id: "8", name: "Museo del Prado", category: "cultura", description: "Pintura europea", distance: "15 min", priceRange: "€€", tip: "Gratis de 18:00 a 20:00", rating: 4.9 },
  { id: "9", name: "Palacio Real", category: "cultura", description: "Residencia oficial", distance: "10 min", priceRange: "€€", tip: "Cambio de guardia los miercoles", rating: 4.7 },
  { id: "10", name: "Retiro", category: "naturaleza", description: "Parque historico", distance: "20 min", tip: "Alquila una barca en el estanque", rating: 4.8 },
  { id: "11", name: "Casa de Campo", category: "naturaleza", description: "Parque natural", distance: "25 min", tip: "Teleferico con vistas increibles" },
  { id: "12", name: "Sala Clamores", category: "ocio", description: "Jazz en vivo", distance: "15 min", priceRange: "€€", tip: "Conciertos cada noche", rating: 4.6 },
  { id: "13", name: "Tour de tapas", category: "experiencias", description: "Ruta gastronomica guiada", priceRange: "€€€", tip: "Reservar con 24h de antelacion", rating: 4.9 },
  { id: "14", name: "Flamenco en Corral", category: "experiencias", description: "Show de flamenco autentico", priceRange: "€€€", tip: "Incluye copa de vino", rating: 4.8 },
];

export default function GuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Guias del Huesped
          </h1>
          <p className="mt-1 text-muted-foreground">
            Crea y gestiona las guias con IA para tus huespedes
          </p>
        </div>
        <Link href="/guide/demo">
          <Button variant="outline" className="gap-2 bg-transparent">
            <ExternalLink className="h-4 w-4" />
            Ver demo
          </Button>
        </Link>
      </div>

      {/* Guides List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {guides.map((guide) => (
          <Card key={guide.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {guide.propertyName}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Badge
                      variant={
                        guide.status === "published" ? "default" : "secondary"
                      }
                      className={
                        guide.status === "published"
                          ? "bg-accent text-accent-foreground"
                          : ""
                      }
                    >
                      {guide.status === "published" ? "Publicada" : "Borrador"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {guide.sections} secciones
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {guide.lastUpdated}
                    </span>
                  </div>
                </div>
              </div>

              {guide.status === "published" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    {guide.aiQueries} consultas IA este mes
                  </span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGuide(guide.id)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  <QrCode className="mr-1 h-3 w-3" />
                  QR Code
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar link
                </Button>
                <Link href="/guide/demo">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Ver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guide Editor */}
      {selectedGuide && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Editando: {guides.find((g) => g.id === selectedGuide)?.propertyName}
            </CardTitle>
            <Button variant="ghost" onClick={() => setSelectedGuide(null)}>
              Cerrar
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                <TabsTrigger value="info">Info General</TabsTrigger>
                <TabsTrigger value="sections">Secciones</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
                <TabsTrigger value="ai">Config IA</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="guide-title">Titulo de bienvenida</Label>
                    <Input
                      id="guide-title"
                      defaultValue="Bienvenido a tu estancia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="host-name">Nombre del anfitrion</Label>
                    <Input id="host-name" defaultValue="Maria" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-msg">Mensaje de bienvenida</Label>
                  <Textarea
                    id="welcome-msg"
                    rows={3}
                    defaultValue="Hola! Gracias por elegir nuestro alojamiento. Aqui encontraras toda la informacion que necesitas para disfrutar de tu estancia."
                  />
                </div>
                <div className="flex justify-end">
                  <Button>Guardar cambios</Button>
                </div>
              </TabsContent>

              <TabsContent value="sections" className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Informacion basica</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sectionTemplates.filter(s => s.category === "basico").map((section) => (
                      <Dialog key={section.title}>
                        <DialogTrigger asChild>
                          <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <CardContent className="flex items-center gap-4 p-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <section.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {section.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {section.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar {section.title}</DialogTitle>
                            <DialogDescription>
                              Actualiza la informacion de esta seccion
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Contenido</Label>
                              <Textarea
                                rows={6}
                                placeholder={`Informacion sobre ${section.title.toLowerCase()}...`}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" className="bg-transparent">Cancelar</Button>
                              <Button>Guardar</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="mt-4 gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Anadir seccion personalizada
                </Button>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium text-foreground">Recomendaciones locales</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Anade tus lugares favoritos para que tus huespedes descubran lo mejor de la zona
                  </p>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                  {sectionTemplates.filter(s => s.category === "recomendaciones").map((cat) => (
                    <Badge 
                      key={cat.title}
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <cat.icon className="h-3.5 w-3.5" />
                      {cat.title}
                    </Badge>
                  ))}
                </div>

                {/* Recommendations list */}
                <div className="space-y-3">
                  {demoRecommendations.slice(0, 6).map((rec) => (
                    <Card key={rec.id} className="group">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground truncate">{rec.name}</h4>
                            {rec.rating && (
                              <div className="flex items-center gap-0.5 text-amber-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="text-xs">{rec.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{rec.description}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">{rec.category}</Badge>
                            {rec.distance && <span className="text-xs text-muted-foreground">{rec.distance}</span>}
                            {rec.priceRange && <span className="text-xs text-muted-foreground">{rec.priceRange}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add recommendation dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 bg-transparent">
                      <Plus className="h-4 w-4" />
                      Anadir recomendacion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nueva recomendacion</DialogTitle>
                      <DialogDescription>
                        Anade un lugar que recomiendas a tus huespedes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nombre del lugar</Label>
                          <Input placeholder="Ej: La Barraca" />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                            <option value="restaurantes">Restaurantes</option>
                            <option value="compras">Compras</option>
                            <option value="cultura">Cultura</option>
                            <option value="playas">Playas</option>
                            <option value="naturaleza">Naturaleza</option>
                            <option value="ocio">Ocio</option>
                            <option value="experiencias">Experiencias</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripcion breve</Label>
                        <Input placeholder="Ej: Paella tradicional valenciana" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Distancia</Label>
                          <Input placeholder="Ej: 5 min" />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio</Label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                            <option value="">Sin especificar</option>
                            <option value="€">€ - Economico</option>
                            <option value="€€">€€ - Moderado</option>
                            <option value="€€€">€€€ - Caro</option>
                            <option value="€€€€">€€€€ - Lujo</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valoracion</Label>
                          <Input type="number" min="1" max="5" step="0.1" placeholder="4.5" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Consejo personal</Label>
                        <Textarea rows={2} placeholder="Ej: Reserva con antelacion, es muy popular" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="bg-transparent">Cancelar</Button>
                        <Button>Guardar recomendacion</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium text-foreground">
                    Configuracion del Asistente IA
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El asistente usara la informacion de las secciones para
                    responder a tus huespedes
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-personality">
                    Personalidad del asistente
                  </Label>
                  <Textarea
                    id="ai-personality"
                    rows={3}
                    defaultValue="Eres un asistente amable y servicial. Responde de forma concisa y util. Si no sabes algo, indica que el huesped contacte al anfitrion."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-restrictions">
                    Informacion adicional para IA
                  </Label>
                  <Textarea
                    id="ai-restrictions"
                    rows={3}
                    placeholder="Anade contexto extra que el asistente debe conocer..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button>Guardar configuracion</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadisticas de uso IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">245</p>
              <p className="text-sm text-muted-foreground">
                Consultas este mes
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">4.8/5</p>
              <p className="text-sm text-muted-foreground">
                Satisfaccion huesped
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">-67%</p>
              <p className="text-sm text-muted-foreground">
                Mensajes directos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
