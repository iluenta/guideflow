'use client';

import React from 'react';
import { ArrowLeft, MapPin, Copy, Phone, ExternalLink, Key, Lock, DoorOpen, Info, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CheckinStep {
    title: string;
    description: string;
    icon: string;
}

interface CheckInViewProps {
    onBack: () => void;
    checkinData: {
        checkin_time?: string;
        emergency_phone?: string;
        steps?: CheckinStep[];
    };
    address: string;
    hostName: string;
    currentLanguage: string;
}

export function CheckInView({ onBack, checkinData, address, hostName, currentLanguage }: CheckInViewProps) {
    const { toast } = useToast();
    const steps = checkinData.steps || [];

    const getIcon = (iconName: string) => {
        switch (iconName?.toLowerCase()) {
            case 'key': return Key;
            case 'lock': return Lock;
            case 'door': return DoorOpen;
            case 'phone': return Phone;
            case 'info': return Info;
            case 'wifi': return Wifi;
            default: return MapPin;
        }
    };

    const isCode = (text: string) => {
        const trimmed = text.trim();
        return /^[0-9A-Z]{3,8}$/.test(trimmed) || trimmed.includes('Código:');
    };

    const handleCopy = (text: string) => {
        const codeMatch = text.match(/Código:\s*([^\s.]+)/) || [null, text];
        const toCopy = codeMatch[1];
        navigator.clipboard.writeText(toCopy);
        toast({
            title: currentLanguage === 'es' ? 'Copiado' : 'Copied',
            description: currentLanguage === 'es' ? 'Código copiado al portapapeles' : 'Code copied to clipboard',
        });
    };

    const openMaps = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS
            ? `http://maps.apple.com/?q=${encodeURIComponent(address)}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#F5F0E8] animate-in fade-in duration-300">
            {/* Header Sticky */}
            <header className="sticky top-0 z-50 w-full bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-black/5 px-4 h-16 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-[#1E3A5F] hover:bg-black/5 rounded-full transition-colors active:scale-90"
                    aria-label="Volver"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <h1 className="font-serif text-xl font-medium text-[#1E3A5F]">
                    Check In
                </h1>
            </header>

            <div className="p-6 max-w-md mx-auto pb-32">
                {/* Time info card */}
                <div className="bg-[#FFFDF9] rounded-xl p-5 mb-6 shadow-[0_1px_3px_rgba(30,58,95,0.04)] text-center">
                    <p className="text-[#6B7B8C] text-[11px] uppercase tracking-wider mb-1 font-sans font-bold">
                        {currentLanguage === 'es' ? 'CHECK-IN DISPONIBLE' : 'CHECK-IN AVAILABLE'}
                    </p>
                    <p className="font-serif text-2xl text-[#1E3A5F]">
                        {checkinData.checkin_time || '15:00 - 22:00'}
                    </p>
                </div>

                {/* Steps List */}
                <div className="space-y-4">
                    {/* Step 1: Address (Fixed) */}
                    <div className="bg-[#FFFDF9] rounded-xl p-5 shadow-[0_1px_3px_rgba(30,58,95,0.04)] flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-[#FFFDF9] flex items-center justify-center font-serif font-semibold shrink-0">
                            1
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-[#1E3A5F]" strokeWidth={1.5} />
                                <h3 className="font-medium text-[#1E3A5F]">
                                    {currentLanguage === 'es' ? 'Dirección' : 'Address'}
                                </h3>
                            </div>
                            <p className="text-[#6B7B8C] text-sm mb-3">
                                {address}
                            </p>
                            <button
                                className="flex items-center gap-2 text-xs font-medium text-[#1E3A5F] bg-[#F5F0E8] px-3 py-1.5 rounded-full transition-colors hover:bg-[#E8E0D4]"
                                onClick={openMaps}
                            >
                                <ExternalLink className="w-3 h-3" />
                                {currentLanguage === 'es' ? 'Ver en mapa' : 'Show on map'}
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Steps */}
                    {steps.map((step, idx) => {
                        const StepIcon = getIcon(step.icon);
                        return (
                            <div key={idx} className="bg-[#FFFDF9] rounded-xl p-5 shadow-[0_1px_3px_rgba(30,58,95,0.04)] flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-[#FFFDF9] flex items-center justify-center font-serif font-semibold shrink-0">
                                    {idx + 2}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <StepIcon className="w-4 h-4 text-[#1E3A5F]" strokeWidth={1.5} />
                                        <h3 className="font-medium text-[#1E3A5F]">{step.title}</h3>
                                    </div>
                                    <p className="text-[#6B7B8C] text-sm mb-3 whitespace-pre-line">
                                        {step.description}
                                    </p>
                                    {isCode(step.description) && (
                                        <button
                                            className="flex items-center gap-2 text-xs font-medium text-[#1E3A5F] bg-[#F5F0E8] px-3 py-1.5 rounded-full transition-colors hover:bg-[#E8E0D4]"
                                            onClick={() => handleCopy(step.description)}
                                        >
                                            <Copy className="w-3 h-3" />
                                            {currentLanguage === 'es' ? 'Copiar código' : 'Copy code'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Help note */}
                {checkinData.emergency_phone && (
                    <div className="mt-8 text-center">
                        <p className="text-[#6B7B8C] text-sm">
                            {currentLanguage === 'es'
                                ? `¿Problemas para entrar? Llama a ${hostName}:`
                                : `Problems entering? Call ${hostName}:`}
                            {' '}
                            <span className="text-[#1E3A5F] font-bold">{checkinData.emergency_phone}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
