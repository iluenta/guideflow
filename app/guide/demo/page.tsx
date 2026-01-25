"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Wifi,
  Key,
  Car,
  MapPin,
  UtensilsCrossed,
  Phone,
  MessageSquare,
  Send,
  ChevronLeft,
  Home,
  Info,
  Coffee,
  Tv,
  AirVent,
  WashingMachine,
  X,
  ArrowUp,
  Sparkles,
  ShoppingBag,
  Landmark,
  TreePine,
  Music,
  Heart,
  Star,
  ExternalLink,
  Navigation,
  Compass,
  ChevronRight,
} from "lucide-react";

const propertyInfo = {
  name: "Apartamento Centro Madrid",
  host: "Maria",
  welcomeMessage:
    "Bienvenido a tu estancia en el corazon de Madrid. Espero que disfrutes tu visita. Aqui encontraras toda la informacion que necesitas.",
  image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=400&fit=crop",
};

const sections = [
  {
    id: "wifi",
    icon: Wifi,
    title: "WiFi",
    shortInfo: "HostGuide_5G",
    content: {
      network: "HostGuide_5G",
      password: "bienvenido2026",
      speed: "300 Mbps",
      tips: "El router esta en el salon. Si tienes problemas, reinicialo desconectando 10 segundos.",
    },
  },
  {
    id: "access",
    icon: Key,
    title: "Acceso",
    shortInfo: "Codigo: 4521#",
    content: {
      checkIn: "15:00 - 22:00",
      checkOut: "Antes de las 11:00",
      doorCode: "4521#",
      instructions:
        "El portal tiene un teclado numerico. Introduce el codigo y pulsa #. La puerta del apartamento usa la misma llave que encontraras en la caja de seguridad junto a la entrada.",
    },
  },
  {
    id: "parking",
    icon: Car,
    title: "Parking",
    shortInfo: "Plaza B-24",
    content: {
      location: "Parking subterraneo del edificio",
      spot: "Plaza B-24",
      access: "Usa el mando que hay en la entrada",
      price: "Incluido en tu reserva",
    },
  },
  {
    id: "location",
    icon: MapPin,
    title: "Ubicacion",
    shortInfo: "Sol, 5 min",
    content: {
      address: "Calle Mayor 15, 3B, Madrid",
      nearbyMetro: "Sol (lineas 1, 2, 3) - 5 min andando",
      landmarks: [
        "Plaza Mayor - 3 min",
        "Puerta del Sol - 5 min",
        "Palacio Real - 10 min",
        "Mercado San Miguel - 4 min",
      ],
    },
  },
  {
    id: "emergency",
    icon: Phone,
    title: "Emergencias",
    shortInfo: "Contactos",
    content: {
      host: "+34 612 345 678",
      emergency: "112",
      police: "091",
      hospital: "Hospital La Paz - 915 678 900",
      pharmacy: "Farmacia 24h en Gran Via, 30",
    },
  },
];

const amenities = [
  { icon: Wifi, name: "WiFi 300Mbps" },
  { icon: Tv, name: "Smart TV" },
  { icon: AirVent, name: "Aire acondicionado" },
  { icon: WashingMachine, name: "Lavadora" },
  { icon: Coffee, name: "Cafetera Nespresso" },
];

const recommendationCategories = [
  { id: "restaurantes", icon: UtensilsCrossed, title: "Restaurantes", color: "bg-orange-500", description: "Donde comer bien" },
  { id: "compras", icon: ShoppingBag, title: "Compras", color: "bg-blue-500", description: "Supermercados y tiendas" },
  { id: "cultura", icon: Landmark, title: "Cultura", color: "bg-purple-500", description: "Museos y monumentos" },
  { id: "naturaleza", icon: TreePine, title: "Naturaleza", color: "bg-green-500", description: "Parques y espacios verdes" },
  { id: "ocio", icon: Music, title: "Ocio", color: "bg-pink-500", description: "Bares y entretenimiento" },
  { id: "experiencias", icon: Heart, title: "Experiencias", color: "bg-red-500", description: "Actividades unicas" },
];

const recommendations = [
  { id: "1", category: "restaurantes", name: "La Barraca", description: "Paella tradicional valenciana", distance: "5 min", priceRange: "€€€", tip: "Reserva con antelacion, es muy popular", rating: 4.8, mapUrl: "https://maps.google.com" },
  { id: "2", category: "restaurantes", name: "Sobrino de Botin", description: "Cochinillo y cordero asado", distance: "3 min", priceRange: "€€€€", tip: "El restaurante mas antiguo del mundo segun Guinness", rating: 4.6, mapUrl: "https://maps.google.com" },
  { id: "3", category: "restaurantes", name: "Mercado San Miguel", description: "Tapas y pinchos variados", distance: "4 min", priceRange: "€€", tip: "Perfecto para probar de todo un poco", rating: 4.5, mapUrl: "https://maps.google.com" },
  { id: "4", category: "restaurantes", name: "Casa Labra", description: "Tapas tradicionales madrilenas", distance: "6 min", priceRange: "€", tip: "Las mejores croquetas de bacalao de Madrid", rating: 4.7, mapUrl: "https://maps.google.com" },
  { id: "5", category: "restaurantes", name: "La Mallorquina", description: "Pasteleria y cafeteria historica", distance: "5 min", priceRange: "€", tip: "Prueba las napolitanas de chocolate", rating: 4.4, mapUrl: "https://maps.google.com" },
  { id: "6", category: "compras", name: "Mercadona", description: "Supermercado grande con parking", distance: "7 min", tip: "Abierto hasta las 21:30", mapUrl: "https://maps.google.com" },
  { id: "7", category: "compras", name: "Carrefour Express", description: "Supermercado 24 horas", distance: "2 min", tip: "Perfecto para compras rapidas", mapUrl: "https://maps.google.com" },
  { id: "8", category: "compras", name: "El Corte Ingles", description: "Grandes almacenes", distance: "10 min", tip: "La planta gourmet es increible", mapUrl: "https://maps.google.com" },
  { id: "9", category: "compras", name: "Farmacia 24h Gran Via", description: "Farmacia de guardia", distance: "8 min", tip: "Abierta toda la noche", mapUrl: "https://maps.google.com" },
  { id: "10", category: "cultura", name: "Museo del Prado", description: "Pintura europea del siglo XII al XIX", distance: "15 min", priceRange: "€€", tip: "Gratis de lunes a sabado de 18:00 a 20:00", rating: 4.9, mapUrl: "https://maps.google.com" },
  { id: "11", category: "cultura", name: "Palacio Real", description: "Residencia oficial de los Reyes", distance: "10 min", priceRange: "€€", tip: "Cambio de guardia los miercoles y sabados", rating: 4.7, mapUrl: "https://maps.google.com" },
  { id: "12", category: "cultura", name: "Museo Reina Sofia", description: "Arte moderno y contemporaneo", distance: "18 min", priceRange: "€€", tip: "Aqui esta el Guernica de Picasso", rating: 4.8, mapUrl: "https://maps.google.com" },
  { id: "13", category: "cultura", name: "Teatro Real", description: "Opera y ballet", distance: "8 min", priceRange: "€€€€", tip: "Visitas guiadas disponibles", rating: 4.7, mapUrl: "https://maps.google.com" },
  { id: "14", category: "naturaleza", name: "Parque del Retiro", description: "Parque historico de 125 hectareas", distance: "20 min", tip: "Alquila una barca en el estanque grande", rating: 4.8, mapUrl: "https://maps.google.com" },
  { id: "15", category: "naturaleza", name: "Templo de Debod", description: "Templo egipcio con vistas", distance: "15 min", tip: "Perfecto para ver el atardecer", rating: 4.6, mapUrl: "https://maps.google.com" },
  { id: "16", category: "naturaleza", name: "Casa de Campo", description: "Parque natural con teleferico", distance: "25 min", tip: "El teleferico tiene vistas increibles", rating: 4.5, mapUrl: "https://maps.google.com" },
  { id: "17", category: "ocio", name: "Sala Clamores", description: "Jazz y blues en vivo", distance: "15 min", priceRange: "€€", tip: "Conciertos casi todas las noches", rating: 4.6, mapUrl: "https://maps.google.com" },
  { id: "18", category: "ocio", name: "Corral de la Moreria", description: "Tablao flamenco", distance: "12 min", priceRange: "€€€€", tip: "El mejor tablao de Madrid", rating: 4.8, mapUrl: "https://maps.google.com" },
  { id: "19", category: "ocio", name: "Cine Callao", description: "Cine historico en Gran Via", distance: "7 min", priceRange: "€€", tip: "Estrenos y peliculas en VO", rating: 4.3, mapUrl: "https://maps.google.com" },
  { id: "20", category: "experiencias", name: "Tour de tapas", description: "Ruta gastronomica guiada", priceRange: "€€€", tip: "Reservar con 24h de antelacion", rating: 4.9, mapUrl: "https://maps.google.com" },
  { id: "21", category: "experiencias", name: "Clase de cocina espanola", description: "Aprende a hacer paella", priceRange: "€€€", tip: "Incluye cena y vino", rating: 4.8, mapUrl: "https://maps.google.com" },
  { id: "22", category: "experiencias", name: "Visita al Bernabeu", description: "Tour del estadio del Real Madrid", priceRange: "€€", tip: "Compra entradas online para evitar colas", rating: 4.7, mapUrl: "https://maps.google.com" },
];

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hola! Soy el asistente virtual de Maria. Puedo ayudarte con cualquier duda sobre el apartamento, la zona o recomendaciones. Que necesitas saber?",
  },
];

const quickQuestions = [
  "Cual es la clave del WiFi?",
  "Como funciona el check-out?",
  "Donde puedo desayunar cerca?",
  "Hay supermercado cerca?",
];

type TabType = "home" | "info" | "discover" | "chat";

export default function GuestGuidePage() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      let response = "";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("wifi") || lowerMessage.includes("internet")) {
        response = `La red WiFi es "HostGuide_5G" y la contrasena es "bienvenido2026". La velocidad es de 300 Mbps. Si tienes algun problema, puedes reiniciar el router que esta en el salon.`;
      } else if (lowerMessage.includes("check") || lowerMessage.includes("salida")) {
        response = `El check-out es antes de las 11:00. Por favor, deja las llaves dentro del apartamento y cierra la puerta al salir. El codigo de acceso es 4521#.`;
      } else if (lowerMessage.includes("desayun") || lowerMessage.includes("cafe")) {
        response = `Para desayunar te recomiendo: 1) La Mallorquina en Puerta del Sol (5 min) - famosa por sus napolitanas. 2) Federal Cafe (8 min) - brunch estilo australiano. 3) Tienes una cafetera Nespresso en el apartamento con capsulas!`;
      } else if (lowerMessage.includes("supermercado") || lowerMessage.includes("compra")) {
        response = `Tienes un Mercadona en Calle Atocha 38 (7 min andando) abierto hasta las 21:30. Tambien hay un Carrefour Express en la esquina (2 min) para cosas rapidas.`;
      } else if (lowerMessage.includes("metro") || lowerMessage.includes("transport")) {
        response = `La estacion de metro mas cercana es Sol (lineas 1, 2 y 3) a 5 minutos andando. Tambien tienes Opera (linea 2 y 5) a 7 minutos. Una tarjeta de 10 viajes cuesta 12,20€.`;
      } else if (lowerMessage.includes("parking") || lowerMessage.includes("aparcar")) {
        response = `Tienes plaza de parking incluida: Plaza B-24 en el parking subterraneo del edificio. El mando para acceder esta junto a la entrada del apartamento.`;
      } else {
        response = `Gracias por tu pregunta. He revisado la informacion disponible pero no tengo una respuesta especifica. Te recomiendo contactar directamente con Maria al +34 612 345 678 para ayudarte mejor.`;
      }

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const selectedSectionData = sections.find((s) => s.id === selectedSection);

  const renderSectionDetail = () => {
    if (!selectedSectionData) return null;

    return (
      <Sheet
        open={selectedSection !== null}
        onOpenChange={(open) => !open && setSelectedSection(null)}
      >
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <selectedSectionData.icon className="h-6 w-6 text-primary" />
              </div>
              <SheetTitle className="text-xl">
                {selectedSectionData.title}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto pb-8">
            {selectedSectionData.id === "wifi" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Red</p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSectionData.content.network}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Contrasena</p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSectionData.content.password}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Velocidad</p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSectionData.content.speed}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedSectionData.content.tips}
                </p>
              </div>
            )}

            {selectedSectionData.id === "access" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-semibold text-foreground">
                      {selectedSectionData.content.checkIn}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-semibold text-foreground">
                      {selectedSectionData.content.checkOut}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Codigo de acceso</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedSectionData.content.doorCode}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedSectionData.content.instructions}
                </p>
              </div>
            )}

            {selectedSectionData.id === "parking" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Tu plaza</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedSectionData.content.spot}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Ubicacion</p>
                  <p className="font-semibold text-foreground">
                    {selectedSectionData.content.location}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedSectionData.content.access}
                </p>
                <Badge className="bg-accent text-accent-foreground">
                  {selectedSectionData.content.price}
                </Badge>
              </div>
            )}

            {selectedSectionData.id === "location" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Direccion</p>
                  <p className="font-semibold text-foreground">
                    {selectedSectionData.content.address}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Metro</p>
                  <p className="font-semibold text-foreground">
                    {selectedSectionData.content.nearbyMetro}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Lugares de interes
                  </p>
                  <div className="space-y-2">
                    {selectedSectionData.content.landmarks.map((landmark: string) => (
                      <div
                        key={landmark}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <MapPin className="h-3 w-3" />
                        {landmark}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedSectionData.id === "emergency" && (
              <div className="space-y-3">
                <a
                  href={`tel:${selectedSectionData.content.host}`}
                  className="flex items-center justify-between rounded-lg bg-primary p-4"
                >
                  <div>
                    <p className="text-sm text-primary-foreground/80">Anfitrion</p>
                    <p className="font-semibold text-primary-foreground">
                      {selectedSectionData.content.host}
                    </p>
                  </div>
                  <Phone className="h-5 w-5 text-primary-foreground" />
                </a>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${selectedSectionData.content.emergency}`}
                    className="rounded-lg bg-destructive/10 p-4"
                  >
                    <p className="text-sm text-muted-foreground">Emergencias</p>
                    <p className="font-semibold text-destructive">
                      {selectedSectionData.content.emergency}
                    </p>
                  </a>
                  <a
                    href={`tel:${selectedSectionData.content.police}`}
                    className="rounded-lg bg-muted p-4"
                  >
                    <p className="text-sm text-muted-foreground">Policia</p>
                    <p className="font-semibold text-foreground">
                      {selectedSectionData.content.police}
                    </p>
                  </a>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Hospital mas cercano</p>
                  <p className="font-semibold text-foreground">
                    {selectedSectionData.content.hospital}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Farmacia 24h</p>
                  <p className="font-semibold text-foreground">
                    {selectedSectionData.content.pharmacy}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // Home Tab Content
  const renderHomeTab = () => (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="relative">
        <img
          src={propertyInfo.image || "/placeholder.svg"}
          alt={propertyInfo.name}
          className="h-48 w-full object-cover sm:h-64"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Badge className="mb-2 bg-accent text-accent-foreground">
            Check-in completado
          </Badge>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {propertyInfo.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Anfitrion: {propertyInfo.host}
          </p>
        </div>
      </section>

      {/* Welcome Message */}
      <section className="p-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                {propertyInfo.welcomeMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Access Cards */}
      <section className="px-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Acceso rapido
        </h2>
        <div className="space-y-3">
          {/* WiFi Card - Most important */}
          <button
            onClick={() => setSelectedSection("wifi")}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">WiFi</h3>
              <p className="text-sm text-muted-foreground">HostGuide_5G</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Access Card */}
          <button
            onClick={() => setSelectedSection("access")}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Acceso</h3>
              <p className="text-sm text-muted-foreground">Codigo: 4521#</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </section>

      {/* Amenities */}
      <section className="mt-6 px-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Servicios incluidos
        </h2>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <Badge
              key={amenity.name}
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5"
            >
              <amenity.icon className="h-3.5 w-3.5" />
              {amenity.name}
            </Badge>
          ))}
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="mt-6 px-4">
        <button
          onClick={() => setSelectedSection("emergency")}
          className="flex w-full items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left transition-all hover:border-destructive active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <Phone className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Contacto de emergencia</h3>
            <p className="text-sm text-muted-foreground">Anfitrion y servicios</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>
    </div>
  );

  // Info Tab Content
  const renderInfoTab = () => (
    <div className="pb-24">
      <div className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Informacion del alojamiento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todo lo que necesitas saber</p>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <section.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.shortInfo}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Discover Tab Content
  const renderDiscoverTab = () => (
    <div className="pb-24">
      <div className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Descubre la zona</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mis recomendaciones personales</p>
      </div>

      {selectedCategory ? (
        <div className="p-4">
          {/* Back button and category header */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a categorias
          </button>

          {(() => {
            const cat = recommendationCategories.find((c) => c.id === selectedCategory);
            if (!cat) return null;
            return (
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color} text-white`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{cat.title}</h2>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
              </div>
            );
          })()}

          {/* Recommendations list */}
          <div className="space-y-3">
            {recommendations
              .filter((r) => r.category === selectedCategory)
              .map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{rec.name}</h3>
                          {rec.rating && (
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="text-xs font-medium">{rec.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{rec.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {rec.distance && (
                            <Badge variant="outline" className="text-xs">
                              <Navigation className="mr-1 h-3 w-3" />
                              {rec.distance}
                            </Badge>
                          )}
                          {rec.priceRange && (
                            <Badge variant="outline" className="text-xs">
                              {rec.priceRange}
                            </Badge>
                          )}
                        </div>
                        {rec.tip && (
                          <p className="mt-2 text-xs text-primary">Tip: {rec.tip}</p>
                        )}
                      </div>
                      <a
                        href={rec.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {recommendationCategories.map((cat) => {
              const count = recommendations.filter((r) => r.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${cat.color} text-white`}>
                    <cat.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{cat.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{count} lugares</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Chat Tab Content
  const renderChatTab = () => (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Chat Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Asistente Virtual</h3>
            <p className="text-xs text-muted-foreground">Siempre disponible para ayudarte</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-xs text-muted-foreground">Preguntas frecuentes</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => handleSendMessage(question)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4 pb-24">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  const navItems = [
    { id: "home" as TabType, icon: Home, label: "Inicio" },
    { id: "info" as TabType, icon: Info, label: "Info" },
    { id: "discover" as TabType, icon: Compass, label: "Descubre" },
    { id: "chat" as TabType, icon: MessageSquare, label: "Asistente" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">HostGuide</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === "home" && renderHomeTab()}
        {activeTab === "info" && renderInfoTab()}
        {activeTab === "discover" && renderDiscoverTab()}
        {activeTab === "chat" && renderChatTab()}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${activeTab === item.id ? "stroke-[2.5]" : ""}`} />
              <span className={`text-xs ${activeTab === item.id ? "font-medium" : ""}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-card" />
      </nav>

      {/* Section Detail Sheet */}
      {renderSectionDetail()}
    </div>
  );
}
