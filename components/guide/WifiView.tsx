'use client';

import React, { useState } from 'react';
import { Wifi, Copy, Check } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

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
    const { content: localizedNetLabel } = useLocalizedContent("NOMBRE DE RED", currentLanguage || 'es', 'ui_label');
    const { content: localizedPassLabel } = useLocalizedContent("CONTRASEÑA", currentLanguage || 'es', 'ui_label');

    const copyToClipboard = (text: string, type: 'network' | 'password') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-beige">
            <PageHeader
                title="WiFi"
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-6 space-y-6">
                {/* WiFi Icon */}
                <div className="flex justify-center py-8">
                    <div className="w-24 h-24 rounded-full bg-cream shadow-card flex items-center justify-center border border-navy/5">
                        <Wifi className="w-12 h-12 text-navy" strokeWidth={1.2} />
                    </div>
                </div>

                {/* Network Details */}
                <div className="space-y-4">
                    <div className="bg-cream rounded-2xl p-6 shadow-card border border-navy/5">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate/60 mb-2">{localizedNetLabel}</p>
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-serif text-xl text-navy font-bold truncate">{networkName}</p>
                            <button
                                onClick={() => copyToClipboard(networkName, 'network')}
                                className="p-3 rounded-xl bg-beige text-navy active:scale-90 transition-all shadow-sm"
                            >
                                {copied === 'network' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-cream rounded-2xl p-6 shadow-card border border-navy/5">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate/60 mb-2">{localizedPassLabel}</p>
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-mono text-xl text-navy tracking-widest font-bold truncate">{password}</p>
                            <button
                                onClick={() => copyToClipboard(password, 'password')}
                                className="p-3 rounded-xl bg-beige text-navy active:scale-90 transition-all shadow-sm"
                            >
                                {copied === 'password' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {(notes || notesLoading) && (
                    <div className={`bg-navy/5 rounded-2xl p-6 border border-navy/10 ${notesLoading ? 'animate-pulse opacity-50' : ''}`}>
                        <p className="text-slate text-sm text-center leading-relaxed font-medium whitespace-pre-wrap">
                            {localizedNotes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
