'use client';

import React, { useState } from 'react';
import { Wifi, Copy, Check } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';

interface WifiViewProps {
    onBack: () => void;
    networkName?: string;
    password?: string;
    notes?: string;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function WifiView({
    onBack,
    networkName = "Cargando...",
    password = "...",
    notes,
    currentLanguage = 'es',
    onLanguageChange
}: WifiViewProps) {
    const [copied, setCopied] = useState<'network' | 'password' | null>(null);
    const { content: localizedNotes, isTranslating: notesLoading } = useLocalizedContent(notes || '', currentLanguage || 'es', 'wifi_notes');
    const { content: localizedNetLabel } = useLocalizedContent("NOMBRE DE LA RED", currentLanguage || 'es', 'ui_label');
    const { content: localizedPassLabel } = useLocalizedContent("CONTRASEÑA", currentLanguage || 'es', 'ui_label');

    const copyToClipboard = (text: string, type: 'network' | 'password') => {
        if (!text || text === "..." || text === "Cargando...") return;
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-beige font-sans">
            <PageHeader
                title="WiFi"
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* WiFi Icon Container */}
                <div className="flex justify-center pt-4">
                    <div className="w-28 h-28 rounded-full bg-white shadow-xl shadow-navy/5 flex items-center justify-center border border-navy/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-navy/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Wifi className="w-10 h-10 text-navy relative z-10" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4 max-w-sm mx-auto w-full">
                    {/* Network Name Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/[0.03] hover:border-navy/10 transition-colors duration-300">
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-navy/40 mb-3">{localizedNetLabel}</p>
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-serif text-xl md:text-2xl text-navy font-bold truncate leading-tight tracking-tight">
                                {networkName}
                            </p>
                            <button
                                onClick={() => copyToClipboard(networkName || '', 'network')}
                                className={cn(
                                    "p-3 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[44px]",
                                    copied === 'network' ? "bg-green-50 text-green-600 scale-105" : "bg-beige text-navy hover:bg-beige/80 active:scale-95"
                                )}
                            >
                                {copied === 'network' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Password Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/[0.03] hover:border-navy/10 transition-colors duration-300">
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-navy/40 mb-3">{localizedPassLabel}</p>
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-mono text-xl text-navy tracking-widest font-bold truncate leading-none">
                                {password}
                            </p>
                            <button
                                onClick={() => copyToClipboard(password || '', 'password')}
                                className={cn(
                                    "p-3 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[44px]",
                                    copied === 'password' ? "bg-green-50 text-green-600 scale-105" : "bg-beige text-navy hover:bg-beige/80 active:scale-95"
                                )}
                            >
                                {copied === 'password' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes Container */}
                {(notes || notesLoading) && (
                    <div className={cn(
                        "bg-navy/[0.04] rounded-2xl p-8 max-w-sm mx-auto border border-navy/[0.08] transition-all duration-500",
                        notesLoading ? 'animate-pulse opacity-50' : 'animate-in fade-in zoom-in-95'
                    )}>
                        <p className="text-navy/60 text-sm italic text-center leading-relaxed font-medium whitespace-pre-wrap">
                            {localizedNotes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
