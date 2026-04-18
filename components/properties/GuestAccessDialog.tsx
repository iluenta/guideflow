"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogBody, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Calendar, User, Loader2, Globe, Info, Link2 } from "lucide-react";
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

            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl">
                {/* Header con icono */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#316263]/10 flex items-center justify-center shrink-0">
                            <Link2 className="h-5 w-5 text-[#316263]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">Generar Enlace Seguro</DialogTitle>
                            <DialogDescription className="text-sm text-slate-400 mt-0.5">
                                Acceso temporal para{' '}
                                <span className="font-semibold text-[#316263]">{propertyName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {!generatedUrl ? (
                    <>
                        <DialogBody className="px-6 py-5 space-y-4">
                            {/* Nombre */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" /> Nombre del huésped
                                </Label>
                                <Input
                                    placeholder="Ej: Juan Pérez"
                                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 focus:border-[#316263]/40"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                />
                            </div>

                            {/* Idioma */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-slate-400" /> Idioma de la guía
                                </Label>
                                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20">
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
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Fechas de estancia
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-xs text-slate-400 font-medium">Check-in</span>
                                        <Input
                                            type="date"
                                            className="h-9 rounded-lg bg-white border-slate-200 text-sm focus:ring-2 focus:ring-[#316263]/20"
                                            value={checkinDate}
                                            onChange={e => setCheckinDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-slate-400 font-medium">Check-out</span>
                                        <Input
                                            type="date"
                                            className="h-9 rounded-lg bg-white border-slate-200 text-sm focus:ring-2 focus:ring-[#316263]/20"
                                            value={checkoutDate}
                                            onChange={e => setCheckoutDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-start gap-1.5 pt-0.5">
                                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        El huésped tendrá acceso desde 2 días antes hasta 2 días después.
                                    </p>
                                </div>
                            </div>
                        </DialogBody>

                        <DialogFooter className="px-6 pb-6 pt-2">
                            <Button
                                className="w-full h-11 rounded-xl font-semibold bg-[#316263] hover:bg-[#316263]/90 text-white shadow-sm shadow-[#316263]/20 gap-2"
                                onClick={handleGenerate}
                                disabled={loading}
                            >
                                {loading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Share2 className="h-4 w-4" />
                                }
                                Generar Enlace de Invitado
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogBody className="px-6 py-5 space-y-4 animate-in fade-in zoom-in duration-300">
                            {/* Éxito */}
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                </div>
                                <p className="text-sm font-semibold text-emerald-700">Enlace listo para compartir</p>
                            </div>

                            {/* URL */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Enlace generado</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={generatedUrl}
                                        className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10 font-mono text-slate-600"
                                    />
                                    <Button
                                        size="icon"
                                        className={`h-10 w-10 shrink-0 rounded-xl transition-colors ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#316263] hover:bg-[#316263]/90'} text-white`}
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 text-center">
                                Puedes enviar este enlace por WhatsApp, email o Booking.
                            </p>
                        </DialogBody>

                        <DialogFooter className="px-6 pb-6 pt-2">
                            <Button
                                variant="ghost"
                                className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl h-10"
                                onClick={() => setGeneratedUrl(null)}
                            >
                                Generar otro enlace
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}