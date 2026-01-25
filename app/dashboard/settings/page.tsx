"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Ajustes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configura tu cuenta y preferencias
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="account">Cuenta</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="billing">Facturacion</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion personal</CardTitle>
              <CardDescription>
                Actualiza tu informacion de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" defaultValue="Usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos</Label>
                  <Input id="lastName" defaultValue="Demo" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="usuario@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" type="tel" defaultValue="+34 612 345 678" />
              </div>
              <div className="flex justify-end">
                <Button>Guardar cambios</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Gestiona tu contrasena</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contrasena actual</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contrasena</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">Cambiar contrasena</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de notificacion</CardTitle>
              <CardDescription>
                Elige como quieres recibir actualizaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Nuevas reservas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Recibe una notificacion cuando tengas una nueva reserva
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Consultas de huespedes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cuando el asistente IA no pueda responder
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Recordatorios de check-in/out
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Un dia antes de cada entrada o salida
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Resumen semanal
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estadisticas y rendimiento cada lunes
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sincronizacion de calendarios</CardTitle>
              <CardDescription>
                Conecta tus cuentas de Airbnb y Booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5A5F]/10">
                    <span className="text-sm font-bold text-[#FF5A5F]">Air</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Airbnb</p>
                    <p className="text-sm text-muted-foreground">
                      Sincroniza via iCal
                    </p>
                  </div>
                </div>
                <Button variant="outline">Conectar</Button>
              </div>
              <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003580]/10">
                    <span className="text-sm font-bold text-[#003580]">B</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Booking.com</p>
                    <p className="text-sm text-muted-foreground">
                      Sincroniza via iCal
                    </p>
                  </div>
                </div>
                <Button variant="outline">Conectar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>URL iCal de exportacion</CardTitle>
              <CardDescription>
                Comparte tu calendario con otras plataformas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  readOnly
                  value="https://hostguide.app/ical/abc123xyz"
                  className="flex-1"
                />
                <Button variant="outline">Copiar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan actual</CardTitle>
              <CardDescription>Gestiona tu suscripcion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">Pro</p>
                    <Badge className="bg-accent text-accent-foreground">
                      Activo
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    €19/mes - Hasta 5 propiedades
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Cambiar plan</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metodo de pago</CardTitle>
              <CardDescription>
                Actualiza tu tarjeta de credito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <span className="text-lg">💳</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Visa terminada en 4242
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expira 12/2027
                    </p>
                  </div>
                </div>
                <Button variant="outline">Actualizar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "1 Ene 2026", amount: "€19,00" },
                  { date: "1 Dic 2025", amount: "€19,00" },
                  { date: "1 Nov 2025", amount: "€19,00" },
                ].map((invoice) => (
                  <div
                    key={invoice.date}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {invoice.date}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Plan Pro mensual
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground">{invoice.amount}</span>
                      <Button variant="ghost" size="sm">
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
