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
    accessToken?: string;
    propertyId?: string; // FASE 17
}

export function WifiView({
    onBack,
    networkName = "Cargando...",
    password = "...",
    notes,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId // FASE 17
}: WifiViewProps) {
    const [copied, setCopied] = useState<'network' | 'password' | null>(null);
    const { content: localizedNotes, isTranslating: notesLoading } = useLocalizedContent(notes || '', currentLanguage || 'es', 'wifi_notes', accessToken, propertyId);
    const { content: localizedNetLabel } = useLocalizedContent("NOMBRE DE LA RED", currentLanguage || 'es', 'ui_label', accessToken, propertyId);
    const { content: localizedPassLabel } = useLocalizedContent("CONTRASEÑA", currentLanguage || 'es', 'ui_label', accessToken, propertyId);

    const copyToClipboard = (text: string, type: 'network' | 'password') => {
        if (!text || text === "..." || text === "Cargando...") return;
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <PageHeader
                title="WiFi"
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-md mx-auto">
                {/* WiFi Icon Container - More Subtle */}
                <div className="flex justify-center pt-2">
                    <div className="w-20 h-20 rounded-full bg-surface shadow-lg shadow-primary/5 flex items-center justify-center border border-primary/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Wifi className="w-8 h-8 text-primary relative z-10" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3.5 w-full">
                    {/* Network Name Card */}
                    <div className="bg-surface rounded-3xl p-5 shadow-card border border-primary/[0.03] hover:border-primary/10 transition-colors duration-300">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/30 mb-3">{localizedNetLabel}</p>
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-serif text-xl text-slate-800 font-bold truncate leading-tight tracking-tight">
                                {networkName}
                            </p>
                            <button
                                onClick={() => copyToClipboard(networkName || '', 'network')}
                                className={cn(
                                    "w-10 h-10 rounded-2xl transition-all duration-300 flex items-center justify-center shrink-0",
                                    copied === 'network' ? "bg-green-50 text-green-600 scale-105" : "bg-primary/[0.04] text-primary hover:bg-primary/[0.08] active:scale-95"
                                )}
                            >
                                {copied === 'network' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Password Card */}
                    <div className="bg-surface rounded-3xl p-5 shadow-card border border-primary/[0.03] hover:border-primary/10 transition-colors duration-300">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/30 mb-3">{localizedPassLabel}</p>
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-mono text-lg text-slate-800 tracking-wider font-bold truncate leading-none">
                                {password}
                            </p>
                            <button
                                onClick={() => copyToClipboard(password || '', 'password')}
                                className={cn(
                                    "w-10 h-10 rounded-2xl transition-all duration-300 flex items-center justify-center shrink-0",
                                    copied === 'password' ? "bg-green-50 text-green-600 scale-105" : "bg-primary/[0.04] text-primary hover:bg-primary/[0.08] active:scale-95"
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
                        "bg-primary/[0.03] rounded-3xl p-6 border border-primary/[0.06] transition-all duration-500",
                        notesLoading ? 'animate-pulse opacity-50' : 'animate-in fade-in zoom-in-95'
                    )}>
                        <p className="text-primary/60 text-[13px] italic text-center leading-relaxed font-medium whitespace-pre-wrap">
                            {localizedNotes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
