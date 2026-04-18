'use client';

import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import {
    Wifi, Tv2, Thermometer, Utensils, Car, Trash2, Zap, Coffee,
    Droplets, Key, Volume2, LogOut, Shirt, Waves, Trophy, Sun,
    Gamepad2, Library
} from 'lucide-react';

interface HowToItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

interface HowToAccordionProps {
    items: HowToItem[];
    currentLanguage?: string;
    accessToken?: string;
    propertyId?: string;
    themeId?: string;
}

// Returns only the icon shape — color is provided by theme tokens
const getIcon = (text: string) => {
    const t = text.toLowerCase();
    const match = (keywords: string[]) => keywords.some(kw => new RegExp(`\\b${kw}\\b|${kw}`, 'i').test(t));

    if (match(['wifi', 'internet', 'conectar', 'red', 'password', 'contraseña'])) return Wifi;
    if (match(['tv', 'televisión', 'netflix', 'hbo', 'disney', 'smart']))          return Tv2;
    if (match(['juego', 'playstation', 'consola', 'xbox']))                         return Gamepad2;
    if (match(['libro', 'leer', 'biblioteca']))                                     return Library;
    if (/\b(ac|aire|acondicionado|clima|frio|calor|calefacción)\b/i.test(t))        return Thermometer;
    if (match(['luz', 'electricidad', 'potencia', 'corte', 'fusible', 'plomos']))   return Zap;
    if (match(['agua', 'grifo', 'ducha', 'termo', 'calentador']))                   return Droplets;
    if (match(['lavadora', 'secadora', 'lavar', 'ropa']))                           return Shirt;
    if (match(['café', 'cafetera', 'nespresso', 'dolce', 'desayuno']))              return Coffee;
    if (match(['cocina', 'horno', 'microondas', 'vitro', 'vitrocerámica', 'comida', 'placa'])) return Utensils;
    if (match(['llave', 'entrar', 'acceso', 'codigo', 'abrir', 'puerta']))          return Key;
    if (match(['check-out', 'salida', 'dejar', 'marcharse']))                       return LogOut;
    if (match(['parking', 'coche', 'garaje', 'aparcar']))                           return Car;
    if (match(['basura', 'reciclar', 'reciclaje', 'contenedor']))                   return Trash2;
    if (match(['ruido', 'fiesta', 'molestar', 'vecinos', 'volumen']))               return Volume2;
    if (match(['piscina', 'nadar', 'cloro', 'toalla']))                             return Waves;
    if (match(['padel', 'tenis', 'deporte', 'gym', 'gimnasio']))                    return Trophy;
    if (match(['terraza', 'jardin', 'balcón', 'exterior', 'sombrilla']))            return Sun;

    return BookOpen;
};

interface ThemeAccordionTokens {
    cardClosed: string;
    cardOpen: string;
    titleClosed: string;
    titleOpen: string;
    answer: string;
    divider: string;
    chevronClosed: string;
    chevronOpen: string;
    iconColor: string;
    iconBg: string;
}

function getAccordionTokens(themeId: string): ThemeAccordionTokens {
    switch (themeId) {
        case 'urban':
            return {
                cardClosed:    'bg-[#1C1C1C] border border-[#333]',
                cardOpen:      'bg-[#27272A] border border-[#00E5FF]/20',
                titleClosed:   'text-white',
                titleOpen:     'text-[#00E5FF]',
                answer:        'text-[#A1A1AA]',
                divider:       'border-[#333]',
                chevronClosed: 'text-[#555]',
                chevronOpen:   'text-[#00E5FF]',
                iconColor:     '#00E5FF',
                iconBg:        '#0F0F0F',
            };
        case 'coastal':
            return {
                cardClosed:    'bg-white border border-[#E0F2FE]',
                cardOpen:      'bg-[#F0F9FF] border border-[#BAE6FD]',
                titleClosed:   'text-[#0C4A6E]',
                titleOpen:     'text-[#0EA5E9]',
                answer:        'text-[#64748B]',
                divider:       'border-[#E0F2FE]',
                chevronClosed: 'text-[#BAE6FD]',
                chevronOpen:   'text-[#0EA5E9]',
                iconColor:     '#0EA5E9',
                iconBg:        '#E0F2FE',
            };
        case 'warm':
            return {
                cardClosed:    'bg-white border border-[#D4A054]/10',
                cardOpen:      'bg-[#FFF8F0] border border-[#D4A054]/20',
                titleClosed:   'text-[#431407]',
                titleOpen:     'text-[#D4A054]',
                answer:        'text-[#8C6B5D]',
                divider:       'border-[#D4A054]/10',
                chevronClosed: 'text-[#D4A054]/30',
                chevronOpen:   'text-[#D4A054]',
                iconColor:     '#D4A054',
                iconBg:        '#FFF8F0',
            };
        case 'luxury':
            return {
                cardClosed:    'bg-white border border-[#D4C5A9]',
                cardOpen:      'bg-[#F9F7F4] border border-[#C9A84C]/30',
                titleClosed:   'text-[#1B2A4A]',
                titleOpen:     'text-[#C9A84C]',
                answer:        'text-[#8A8070]',
                divider:       'border-[#D4C5A9]',
                chevronClosed: 'text-[#D4C5A9]',
                chevronOpen:   'text-[#C9A84C]',
                iconColor:     '#C9A84C',
                iconBg:        '#F9F7F4',
            };
        default: // modern
            return {
                cardClosed:    'bg-white border border-[#E4E4E7]',
                cardOpen:      'bg-[#F4F4F5] border border-[#E4E4E7]',
                titleClosed:   'text-[#09090B]',
                titleOpen:     'text-[#18181B]',
                answer:        'text-[#52525B]',
                divider:       'border-[#E4E4E7]',
                chevronClosed: 'text-[#A1A1AA]',
                chevronOpen:   'text-[#52525B]',
                iconColor:     '#52525B',
                iconBg:        '#F4F4F5',
            };
    }
}

function HowToAccordionItem({
    item,
    currentLanguage,
    accessToken,
    propertyId,
    tokens,
}: {
    item: HowToItem;
    currentLanguage: string;
    accessToken?: string;
    propertyId?: string;
    tokens: ThemeAccordionTokens;
}) {
    const { content: localizedQuestion } = useLocalizedContent(item.question, currentLanguage, 'faq_question', accessToken, propertyId);
    const { content: localizedAnswer } = useLocalizedContent(item.answer, currentLanguage, 'faq_answer', accessToken, propertyId);
    const [isOpen, setIsOpen] = useState(false);

    const Icon = getIcon(item.question);

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-start gap-4 p-5 rounded-2xl text-left transition-all duration-300',
                    isOpen ? tokens.cardOpen : tokens.cardClosed
                )}
            >
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300"
                    style={{
                        backgroundColor: tokens.iconBg,
                        color: tokens.iconColor,
                        transform: isOpen ? 'scale(1.05) rotate(5deg)' : 'scale(1)'
                    }}
                >
                    <Icon size={20} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn('text-[15px] font-bold leading-tight transition-colors duration-300', isOpen ? tokens.titleOpen : tokens.titleClosed)}>
                        {localizedQuestion}
                    </p>
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="overflow-hidden"
                            >
                                <p className={cn('text-[14px] leading-relaxed mt-4 pt-4 border-t font-medium font-sans', tokens.answer, tokens.divider)}>
                                    {localizedAnswer}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 mt-3">
                    <ChevronDown size={14} className={cn('transition-colors', isOpen ? tokens.chevronOpen : tokens.chevronClosed)} />
                </motion.div>
            </button>
        </motion.div>
    );
}

export function HowToAccordion({
    items,
    currentLanguage = 'es',
    accessToken,
    propertyId,
    themeId = 'modern',
}: HowToAccordionProps) {
    const tokens = getAccordionTokens(themeId);

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <HowToAccordionItem
                    key={item.id}
                    item={item}
                    currentLanguage={currentLanguage}
                    accessToken={accessToken}
                    propertyId={propertyId}
                    tokens={tokens}
                />
            ))}
        </div>
    );
}
