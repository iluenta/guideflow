"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Calendar, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

interface GuestAccessDialogProps {
    propertyId: string;
    propertyName: string;
}

export function GuestAccessDialog({ propertyId, propertyName }: GuestAccessDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [checkinDate, setCheckinDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [checkoutDate, setCheckoutDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        try {
            const response = await fetch("/api/create-guest-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    guestName,
                    checkinDate,
                    checkoutDate
                })
            });

            const data = await response.json();
            if (response.ok) {
                const fullUrl = `${window.location.origin}${data.url}`;
                setGeneratedUrl(fullUrl);
                toast.success("Enlace generado correctamente");
            } else {
                toast.error(data.error || "Error al generar el enlace");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard() {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        toast.success("Enlace copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setGeneratedUrl(null);
                setGuestName("");
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9">
                    <Share2 className="h-3.5 w-3.5" />
                    Compartir
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Generar Enlace Seguro</DialogTitle>
                    <DialogDescription className="font-medium">
                        Crea un acceso temporal personalizado para tu huésped en <span className="text-emerald-600 font-bold">{propertyName}</span>.
                    </DialogDescription>
                </DialogHeader>

                {!generatedUrl ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="guestName" className="font-bold flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" /> Nombre del Huésped
                                </Label>
                                <Input
                                    id="guestName"
                                    placeholder="Ej: Juan Pérez"
                                    className="rounded-xl"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="checkinDate" className="font-bold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" /> Check-in
                                    </Label>
                                    <Input
                                        id="checkinDate"
                                        type="date"
                                        className="rounded-xl"
                                        value={checkinDate}
                                        onChange={(e) => setCheckinDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkoutDate" className="font-bold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" /> Check-out
                                    </Label>
                                    <Input
                                        id="checkoutDate"
                                        type="date"
                                        className="rounded-xl"
                                        value={checkoutDate}
                                        onChange={(e) => setCheckoutDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium -mt-2">
                                El huésped tendrá acceso desde 2 días antes hasta 2 días después.
                            </p>
                        </div>
                        <Button
                            className="w-full h-12 rounded-2xl font-black bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-black/10"
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                            Generar Enlace de Invitado
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                <Check className="h-3 w-3" /> Enlace listo para compartir
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={generatedUrl}
                                    className="bg-white border-emerald-200 rounded-xl font-medium text-xs h-10"
                                />
                                <Button
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                Puedes enviar este enlace por WhatsApp o Booking.
                            </p>
                            <Button
                                variant="ghost"
                                className="mt-2 text-xs font-bold text-slate-400"
                                onClick={() => setGeneratedUrl(null)}
                            >
                                Generar otro diferente
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
