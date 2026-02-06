'use client';

import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wifi,
    Tv,
    Thermometer,
    Wind,
    Utensils,
    Lock,
    Car,
    Trash2,
    Zap,
    Coffee,
    Bath,
    Droplets,
    Lightbulb,
    Key,
    Volume2,
    LogOut,
    Shirt,
    Sparkles,
    Waves,
    Trophy,
    Sun,
    Gamepad2,
    Library,
    Tv2,
    Umbrella,
    Dices
} from 'lucide-react';

interface HowToItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

interface HowToAccordionProps {
    items: HowToItem[];
}

export function HowToAccordion({ items }: HowToAccordionProps) {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    const getIconDetails = (text: string) => {
        const t = text.toLowerCase();

        const match = (keywords: string[]) =>
            keywords.some(kw => new RegExp(`\\b${kw}\\b|${kw}`, 'i').test(t));

        // Tech & Connectivity
        if (match(['wifi', 'internet', 'conectar', 'red', 'password', 'contraseña']))
            return { icon: Wifi, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.08)' };

        // Entertainment
        if (match(['tv', 'televisión', 'netflix', 'hbo', 'disney', 'smart']))
            return { icon: Tv2, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)' };
        if (match(['juego', 'playstation', 'consola', 'xbox']))
            return { icon: Gamepad2, color: '#db2777', bg: 'rgba(219, 39, 119, 0.08)' };
        if (match(['libro', 'leer', 'biblioteca']))
            return { icon: Library, color: '#059669', bg: 'rgba(5, 150, 105, 0.08)' };

        // Climate & Power (Prioritized AC to avoid "hacer/acceder" false positives)
        // We use a more specific regex for 'ac' to ensure it's referring to Climate
        if (/\b(ac|aire|acondicionado|clima|frio|calor|calefacción)\b/i.test(t))
            return { icon: Thermometer, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.08)' };

        if (match(['luz', 'electricidad', 'potencia', 'corte', 'fusible', 'plomos']))
            return { icon: Zap, color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' };

        if (match(['agua', 'grifo', 'ducha', 'termo', 'calentador']))
            return { icon: Droplets, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)' };

        // Kitchen & Laundry
        if (match(['lavadora', 'secadora', 'lavar', 'ropa']))
            return { icon: Shirt, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)' };
        if (match(['café', 'cafetera', 'nespresso', 'dolce', 'desayuno']))
            return { icon: Coffee, color: '#92400e', bg: 'rgba(146, 64, 14, 0.08)' };
        if (match(['cocina', 'horno', 'microondas', 'vitro', 'vitrocerámica', 'comida', 'placa']))
            return { icon: Utensils, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)' };

        // Access & Safety
        if (match(['llave', 'entrar', 'acceso', 'codigo', 'abrir', 'puerta']))
            return { icon: Key, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' };
        if (match(['check-out', 'salida', 'dejar', 'marcharse']))
            return { icon: LogOut, color: '#4b5563', bg: 'rgba(75, 85, 99, 0.08)' };
        if (match(['parking', 'coche', 'garaje', 'aparcar']))
            return { icon: Car, color: '#475569', bg: 'rgba(71, 85, 105, 0.08)' };
        if (match(['basura', 'reciclar', 'reciclaje', 'contenedor']))
            return { icon: Trash2, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)' };
        if (match(['ruido', 'fiesta', 'molestar', 'vecinos', 'volumen']))
            return { icon: Volume2, color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' };

        // Outdoors
        if (match(['piscina', 'nadar', 'cloro', 'toalla']))
            return { icon: Waves, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' };
        if (match(['padel', 'tenis', 'deporte', 'gym', 'gimnasio']))
            return { icon: Trophy, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
        if (match(['terraza', 'jardin', 'balcón', 'exterior', 'sombrilla']))
            return { icon: Sun, color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)' };

        return { icon: BookOpen, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' };
    };

    return (
        <div className="space-y-3">
            {items.map((item) => {
                const { icon: Icon, color, bg } = getIconDetails(item.question);
                const isOpen = openId === item.id;

                return (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden"
                    >
                        <button
                            onClick={() => toggle(item.id)}
                            className={cn(
                                "w-full flex items-start gap-5 p-5 rounded-3xl text-left transition-all duration-300",
                                isOpen
                                    ? "bg-stone-50/80 backdrop-blur-sm border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                                    : "bg-stone-50/30 border border-stone-100 hover:border-primary/10"
                            )}
                        >
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500"
                                style={{
                                    backgroundColor: bg,
                                    color: color,
                                    transform: isOpen ? 'scale(1.05) rotate(5deg)' : 'scale(1)'
                                }}
                            >
                                <Icon size={22} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className={cn(
                                    "text-[15px] font-bold leading-tight transition-colors duration-300",
                                    isOpen ? "text-primary" : "text-slate-800"
                                )}>
                                    {item.question}
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
                                            <p className="text-[14px] text-slate/70 leading-relaxed mt-4 pt-4 border-t border-stone-200/50 font-medium font-sans">
                                                {item.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="shrink-0 mt-3"
                            >
                                <ChevronDown size={14} className={cn("transition-colors", isOpen ? "text-primary" : "text-slate-300")} />
                            </motion.div>
                        </button>
                    </motion.div>
                );
            })}
        </div>
    );
}
