"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogBody, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Calendar, User, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { SUPPORTED_LANGUAGES } from "@/components/guide/LanguageSelector";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface GuestAccessDialogProps {
    propertyId: string;
    propertyName: string;
    children?: React.ReactNode;
}

export function GuestAccessDialog({ propertyId, propertyName, children }: GuestAccessDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [checkinDate, setCheckinDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [checkoutDate, setCheckoutDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("es");

    async function handleGenerate() {
        setLoading(true);
        try {
            const response = await fetch("/api/create-guest-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId, guestName, checkinDate, checkoutDate, language: selectedLanguage })
            });
            const data = await response.json();
            if (response.ok) {
                setGeneratedUrl(`${window.location.origin}${data.url}`);
                toast.success("Enlace generado correctamente");
            } else {
                toast.error(data.error || "Error al generar el enlace");
            }
        } catch {
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
            if (!val) { setGeneratedUrl(null); setGuestName(""); }
        }}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button variant="outline" className="gap-2 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 h-9 rounded-xl">
                        <Share2 className="h-3.5 w-3.5" />
                        Compartir
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Generar Enlace Seguro</DialogTitle>
                    <DialogDescription>
                        Crea un acceso temporal para tu huésped en{' '}
                        <span className="font-semibold text-[#316263]">{propertyName}</span>.
                    </DialogDescription>
                </DialogHeader>

                {!generatedUrl ? (
                    <>
                        <DialogBody className="space-y-4">
                            {/* Nombre */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" /> Nombre del Huésped
                                </Label>
                                <Input
                                    placeholder="Ej: Juan Pérez"
                                    className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                />
                            </div>

                            {/* Idioma */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" /> Idioma de la Guía
                                </Label>
                                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                    <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20">
                                        <SelectValue placeholder="Selecciona un idioma" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-xl border-slate-100">
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                <span className="mr-2">{lang.flag_emoji}</span>
                                                {lang.native_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Check-in
                                    </Label>
                                    <Input
                                        type="date"
                                        className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20"
                                        value={checkinDate}
                                        onChange={e => setCheckinDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Check-out
                                    </Label>
                                    <Input
                                        type="date"
                                        className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20"
                                        value={checkoutDate}
                                        onChange={e => setCheckoutDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400">
                                El huésped tendrá acceso desde 2 días antes hasta 2 días después.
                            </p>
                        </DialogBody>

                        <DialogFooter>
                            <Button
                                className="w-full h-11 rounded-xl font-bold bg-[#316263] hover:bg-[#316263]/90 text-white shadow-sm shadow-[#316263]/20"
                                onClick={handleGenerate}
                                disabled={loading}
                            >
                                {loading
                                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    : <Share2 className="h-4 w-4 mr-2" />
                                }
                                Generar Enlace de Invitado
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogBody className="space-y-4 animate-in fade-in zoom-in duration-300">
                            {/* Enlace generado */}
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                                    <Check className="h-3.5 w-3.5" /> Enlace listo para compartir
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={generatedUrl}
                                        className="bg-white border-emerald-200 rounded-xl text-xs h-10 font-mono"
                                    />
                                    <Button
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 text-center">
                                Puedes enviar este enlace por WhatsApp o Booking.
                            </p>
                        </DialogBody>

                        <DialogFooter>
                            <Button
                                variant="ghost"
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                                onClick={() => setGeneratedUrl(null)}
                            >
                                Generar otro diferente
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}