'use client';

import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Language {
    code: string;
    name: string;
    native_name: string;
    flag_emoji: string;
}

interface LanguageSelectorProps {
    currentLanguage?: string;
    onLanguageChange: (lang: string) => void;
    disabled?: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'es', name: 'Spanish', native_name: 'Español', flag_emoji: '🇪🇸' },
    { code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇬🇧' },
    { code: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷' },
    { code: 'de', name: 'German', native_name: 'Deutsch', flag_emoji: '🇩🇪' },
    { code: 'it', name: 'Italian', native_name: 'Italiano', flag_emoji: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', native_name: 'Português', flag_emoji: '🇵🇹' },
    { code: 'ca', name: 'Catalan', native_name: 'Català', flag_emoji: 'CA' },
    { code: 'gl', name: 'Galician', native_name: 'Galego', flag_emoji: 'GL' },
    { code: 'eu', name: 'Basque', native_name: 'Euskara', flag_emoji: 'EU' },
];

export function LanguageSelector({ currentLanguage = 'es', onLanguageChange, disabled = false }: LanguageSelectorProps) {
    const current = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

    if (disabled) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 px-0 h-9 text-navy hover:bg-transparent font-bold transition-all active:scale-95"
                >
                    <span className="text-xs uppercase tracking-wider">{current.code}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md border-navy/5 shadow-xl rounded-xl p-1">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate/40">
                    Select Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className={`
                            flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer
                            transition-colors duration-200
                            ${currentLanguage === lang.code
                                ? 'bg-navy/5 text-navy font-bold'
                                : 'text-slate hover:bg-navy/5/5'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <span className={lang.flag_emoji.length === 2 ? "text-[10px] font-bold w-5 text-center" : "text-xl w-5 text-center"}>
                                {lang.flag_emoji}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm">{lang.native_name}</span>
                                <span className="text-[10px] opacity-50 font-medium">{lang.name}</span>
                            </div>
                        </div>
                        {currentLanguage === lang.code && (
                            <Check className="w-4 h-4 text-navy" />
                        )}
                    </DropdownMenuItem>
                ))}
                <div className="mt-1 pt-1 border-t border-navy/5 px-3 py-2">
                    <p className="text-[10px] text-slate/40 italic">
                        Translations powered by AI
                    </p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
