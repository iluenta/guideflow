'use client'

import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    Key
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

    const getIcon = (text: string) => {
        const t = text.toLowerCase();
        if (t.includes('wifi') || t.includes('internet')) return Wifi;
        if (t.includes('tv') || t.includes('televisión') || t.includes('entretenimiento')) return Tv;
        if (t.includes('clima') || t.includes('aire') || t.includes('ac') || t.includes('calefacción')) return Thermometer;
        if (t.includes('lavadora') || t.includes('secadora') || t.includes('ropa')) return Wind;
        if (t.includes('cocina') || t.includes('horno') || t.includes('microondas')) return Utensils;
        if (t.includes('seguridad') || t.includes('alarma')) return Lock;
        if (t.includes('parking') || t.includes('coche') || t.includes('aparcamiento')) return Car;
        if (t.includes('basura') || t.includes('reciclaje')) return Trash2;
        if (t.includes('luz') || t.includes('electricidad')) return Zap;
        if (t.includes('café') || t.includes('cafetera')) return Coffee;
        if (t.includes('baño') || t.includes('ducha')) return Bath;
        if (t.includes('agua')) return Droplets;
        if (t.includes('llave')) return Key;
        return BookOpen;
    };

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const Icon = getIcon(item.question);
                const isOpen = openId === item.id;

                return (
                    <div
                        key={item.id}
                        className={cn(
                            "bg-white rounded-[2rem] shadow-card border border-navy/[0.02] overflow-hidden transition-all duration-300",
                            isOpen && "ring-1 ring-navy/5 shadow-lg"
                        )}
                    >
                        <button
                            onClick={() => toggle(item.id)}
                            className="w-full px-6 py-5 flex items-center gap-5 text-left"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 shrink-0",
                                isOpen ? "bg-navy text-white" : "bg-beige text-navy"
                            )}>
                                <Icon className="w-7 h-7" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-serif text-[17px] font-bold text-navy leading-tight">
                                    {item.question}
                                </h4>
                            </div>
                            <ChevronDown
                                className={cn(
                                    "w-5 h-5 text-navy/30 transition-transform duration-300",
                                    isOpen && "rotate-180"
                                )}
                            />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}>
                            <div className="overflow-hidden">
                                <div className="px-6 pb-6 pt-2">
                                    <div className="h-[1px] w-full bg-navy/5 mb-6" />
                                    <p className="text-slate text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
