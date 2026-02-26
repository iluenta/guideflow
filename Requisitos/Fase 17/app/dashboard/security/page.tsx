"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Key, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function SecurityPage() {
    const [tokens, setTokens] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch Tokens with Property Name
            const { data: tokenData } = await supabase
                .from('guest_access_tokens')
                .select('*, properties(name)')
                .order('created_at', { ascending: false });

            // Fetch Suspicious Activities
            const { data: activityData } = await supabase
                .from('suspicious_activities')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setTokens(tokenData || []);
            setActivities(activityData || []);
        } catch (error) {
            console.error("Error fetching security data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleTokenStatus(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('guest_access_tokens')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (!error) fetchData();
    }

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-lg" />
                    <div className="h-4 w-96 bg-slate-50 animate-pulse rounded-lg" />
                </div>
                <div className="h-96 bg-slate-50 animate-pulse rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-1 sm:p-0">
            <div>
                <h1 className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
                    Seguridad y Accesos
                </h1>
                <p className="mt-1 text-slate-500 font-medium">
                    Gestiona los accesos de tus huéspedes y monitoriza la actividad del sistema.
                </p>
            </div>

            <Tabs defaultValue="tokens" className="w-full">
                <TabsList className="mb-8 p-1.5 bg-slate-100/50 rounded-2xl inline-flex w-full sm:w-auto h-auto">
                    <TabsTrigger value="tokens" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">Accesos Activos</span>
                        <span className="sm:hidden">Accesos</span>
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        <span className="hidden sm:inline">Alertas de Seguridad</span>
                        <span className="sm:hidden">Alertas</span>
                        {activities.length > 0 && (
                            <Badge className="ml-1 bg-red-500 text-white border-none text-[10px] h-5 min-w-[20px] px-1 justify-center pointer-events-none">
                                {activities.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tokens">
                    <Card className="rounded-[2.5rem] border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-8">
                            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Tokens de Acceso</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                Enlaces temporales generados para la estancia de tus huéspedes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/30">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Huésped</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Propiedad</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Vence</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Estado</TableHead>
                                        <TableHead className="text-right px-8 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tokens.map((token) => (
                                        <TableRow key={token.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="px-8 py-4">
                                                <span className="font-bold text-slate-900">{token.guest_name}</span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="font-semibold text-slate-600 bg-slate-100/50 px-2 py-1 rounded-lg text-xs">
                                                    {token.properties?.name || '---'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 font-medium text-slate-500 text-sm">
                                                {format(new Date(token.checkout_date), "d MMM, HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {token.is_active ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider w-fit">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Activo
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider w-fit">
                                                        Revocado
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-8 py-4">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => toggleTokenStatus(token.id, token.is_active)}
                                                    className={`h-9 px-4 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all ${token.is_active
                                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-none'
                                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none'
                                                        }`}
                                                >
                                                    {token.is_active ? 'Desactivar' : 'Reactivar'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tokens.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center space-y-3">
                                                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto ring-1 ring-slate-100">
                                                    <Key className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No hay tokens activos</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts">
                    <Card className="rounded-[2.5rem] border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-8">
                            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Alertas Recientes</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                Registro de bloqueos por rate limiting e intentos de inyección.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-5 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 hover:scale-[1.01] group">
                                        <div className={`p-4 rounded-2xl shrink-0 ${activity.activity_type.includes('injection') ? 'bg-red-100 text-red-600' :
                                            activity.activity_type.includes('limit') ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-black text-slate-950 capitalize truncate text-lg">
                                                    {activity.activity_type.replace(/_/g, ' ')}
                                                </p>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0">
                                                    {format(new Date(activity.created_at), "HH:mm · d MMM", { locale: es })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[10px] px-2 py-0 h-5 font-bold">
                                                    IP {activity.ip_address || '---'}
                                                </Badge>
                                                <span className="truncate">
                                                    Detalles: {typeof activity.details === 'object' ? JSON.stringify(activity.details) : activity.details}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {activities.length === 0 && (
                                    <div className="py-24 text-center space-y-4">
                                        <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-[12px] ring-emerald-50/30">
                                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-900 font-black text-lg">Entorno Seguro</p>
                                            <p className="text-slate-400 font-medium">No se han detectado amenazas en las últimas 24 horas.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
