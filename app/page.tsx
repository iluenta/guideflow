"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  MessageSquare,
  Globe,
  BarChart3,
  Shield,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Home,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Landing Personalizable",
    description:
      "Crea tu propia web de reservas con tu marca, fotos y textos personalizados. Sin conocimientos tecnicos.",
  },
  {
    icon: Calendar,
    title: "Calendario Inteligente",
    description:
      "Gestiona disponibilidad, precios por temporada y sincroniza con Airbnb y Booking automaticamente.",
  },
  {
    icon: MessageSquare,
    title: "Guia con IA",
    description:
      "Tu huesped tiene un asistente 24/7 que responde preguntas sobre el alojamiento, zona y recomendaciones.",
  },
  {
    icon: BarChart3,
    title: "Analiticas",
    description:
      "Visualiza ocupacion, ingresos y rendimiento de tu alojamiento en tiempo real.",
  },
];

const stats = [
  { value: "85%", label: "Reduccion en consultas repetitivas" },
  { value: "4.9/5", label: "Valoracion media de huespedes" },
  { value: "3min", label: "Para crear tu landing" },
  { value: "24/7", label: "Asistente IA disponible" },
];

const testimonials = [
  {
    name: "Maria Garcia",
    role: "3 apartamentos en Barcelona",
    content:
      "Mis huespedes ya no me escriben a las 2am preguntando la clave del WiFi. La guia con IA lo responde todo.",
    rating: 5,
  },
  {
    name: "Carlos Rodriguez",
    role: "Casa rural en Asturias",
    content:
      "Por fin tengo reservas directas sin comisiones. La landing quedo profesional en minutos.",
    rating: 5,
  },
  {
    name: "Ana Fernandez",
    role: "5 propiedades en Valencia",
    content:
      "El calendario sincronizado me ahorra horas cada semana. Imprescindible.",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "0",
    period: "para siempre",
    description: "Perfecto para empezar",
    features: [
      "1 propiedad",
      "Landing basica",
      "Calendario simple",
      "100 consultas IA/mes",
    ],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "19",
    period: "/mes",
    description: "Para propietarios serios",
    features: [
      "Hasta 5 propiedades",
      "Landing personalizable",
      "Sincronizacion iCal",
      "IA ilimitada",
      "Analiticas avanzadas",
      "Soporte prioritario",
    ],
    cta: "Probar 14 dias gratis",
    highlighted: true,
  },
  {
    name: "Business",
    price: "49",
    period: "/mes",
    description: "Para gestores profesionales",
    features: [
      "Propiedades ilimitadas",
      "Todo en Pro",
      "Multi-usuario",
      "API access",
      "Dominio personalizado",
      "Onboarding dedicado",
    ],
    cta: "Contactar ventas",
    highlighted: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                HostGuide
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Funcionalidades
              </a>
              <a
                href="#pricing"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Precios
              </a>
              <a
                href="#testimonials"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Testimonios
              </a>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Iniciar sesion
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">Empezar gratis</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="space-y-1 px-4 pb-4 pt-2">
              <a
                href="#features"
                className="block rounded-lg px-3 py-2 text-base text-muted-foreground hover:bg-muted"
              >
                Funcionalidades
              </a>
              <a
                href="#pricing"
                className="block rounded-lg px-3 py-2 text-base text-muted-foreground hover:bg-muted"
              >
                Precios
              </a>
              <a
                href="#testimonials"
                className="block rounded-lg px-3 py-2 text-base text-muted-foreground hover:bg-muted"
              >
                Testimonios
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full bg-transparent">
                    Iniciar sesion
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full">Empezar gratis</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">
                Nuevo: Guia del huesped con IA
              </span>
            </div>

            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Tu alojamiento turistico,{" "}
              <span className="text-primary">gestionado sin esfuerzo</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Landing personalizable, calendario inteligente y guia del huesped
              con IA. Todo lo que necesitas para gestionar tu alojamiento en una
              sola plataforma.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Empezar gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/guide/demo">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  Ver demo de guia
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Sin tarjeta de credito. Configurado en 3 minutos.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:mt-20 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Todo lo que necesitas para tu alojamiento
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Herramientas disenadas especificamente para propietarios de
              alojamientos turisticos
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border bg-card transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Seguridad GDPR
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cumplimiento normativo europeo incluido
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Smartphone className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Mobile First</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optimizado para que tus huespedes lo usen en movil
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Setup rapido</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu primera landing lista en menos de 5 minutos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Propietarios como tu ya estan ahorrando tiempo y mejorando la
              experiencia de sus huespedes
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-foreground">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="mt-6">
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Precios simples y transparentes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Empieza gratis, escala cuando lo necesites
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-2 ${
                  plan.highlighted
                    ? "border-primary shadow-lg"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Mas popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Empieza hoy, es gratis
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Unete a cientos de propietarios que ya gestionan sus alojamientos de
            forma mas inteligente
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                HostGuide
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Privacidad
              </a>
              <a href="#" className="hover:text-foreground">
                Terminos
              </a>
              <a href="#" className="hover:text-foreground">
                Contacto
              </a>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            2026 HostGuide. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
