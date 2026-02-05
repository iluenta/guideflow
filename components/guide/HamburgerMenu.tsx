'use client';

import React from 'react';
import {
    X,
    Wifi,
    ShieldAlert,
    BookOpen,
    Key,
    Clock,
    MapPin,
    Share2,
    Phone,
    MessageCircle,
    Utensils,
    Theater,
    ShoppingBag,
    LogOut,
    HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (pageId: string) => void;
    currentLanguage?: string;
    propertyName: string;
    propertyId: string;
}

export function HamburgerMenu({
    isOpen,
    onClose,
    onNavigate,
    currentLanguage = 'es',
    propertyName,
    propertyId
}: HamburgerMenuProps) {
    const { content: labelWifi } = useLocalizedContent('Conexión WiFi', currentLanguage, 'ui_label');
    const { content: labelRules } = useLocalizedContent('Normas y Salida', currentLanguage, 'ui_label');
    const { content: labelHowto } = useLocalizedContent('Guías de Uso', currentLanguage, 'ui_label');
    const { content: labelEmergency } = useLocalizedContent('Emergencias', currentLanguage, 'ui_label');
    const { content: labelEat } = useLocalizedContent('Dónde Comer', currentLanguage, 'ui_label');
    const { content: labelDo } = useLocalizedContent('Qué Hacer', currentLanguage, 'ui_label');
    const { content: labelShop } = useLocalizedContent('Compras', currentLanguage, 'ui_label');

    const menuGroups = [
        {
            title: currentLanguage === 'es' ? 'IMPRESCINDIBLE' : 'ESSENTIALS',
            items: [
                { id: 'wifi', icon: Wifi, label: labelWifi, color: 'text-blue-500' },
                { id: 'rules', icon: Clock, label: labelRules, color: 'text-orange-500' },
                { id: 'checkin', icon: Key, label: currentLanguage === 'es' ? 'Llegada y Llaves' : 'Access & Keys', color: 'text-green-500' },
            ]
        },
        {
            title: currentLanguage === 'es' ? 'TU ESTANCIA' : 'YOUR STAY',
            items: [
                { id: 'manuals', icon: BookOpen, label: labelHowto, color: 'text-purple-500' },
                { id: 'house-info', icon: HelpCircle, label: currentLanguage === 'es' ? 'Sobre la Casa' : 'About the House', color: 'text-teal-500' },
                { id: 'emergency', icon: ShieldAlert, label: labelEmergency, color: 'text-rose-500' },
            ]
        },
        {
            title: currentLanguage === 'es' ? 'EXPLORA' : 'EXPLORE',
            items: [
                { id: 'eat', icon: Utensils, label: labelEat, color: 'text-navy/60' },
                { id: 'do', icon: Theater, label: labelDo, color: 'text-navy/60' },
                { id: 'shopping', icon: ShoppingBag, label: labelShop, color: 'text-navy/60' },
            ]
        }
    ];


    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-navy/40 backdrop-blur-sm z-[60] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Menu Panel */}
            <div
                className={cn(
                    "fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl transition-transform duration-500 ease-out transform",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 pb-4 flex items-center justify-between border-b border-navy/5">
                        <div className="space-y-0.5">
                            <h2 className="font-serif text-lg font-bold text-navy uppercase tracking-tight truncate max-w-[180px]">
                                {propertyName}
                            </h2>
                            <p className="text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                                {currentLanguage === 'es' ? 'Menú de Ayuda' : 'Help Menu'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-navy/5 text-navy/60 hover:text-navy transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menu Content */}
                    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                        {menuGroups.map((group, idx) => (
                            <div key={idx} className="space-y-3">
                                <h3 className="px-4 text-[10px] font-black text-navy/20 tracking-[0.2em] uppercase">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                onNavigate(item.id);
                                                onClose();
                                            }}
                                            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-navy/[0.03] active:bg-navy/5 transition-all text-left group"
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl bg-beige flex items-center justify-center transition-transform group-active:scale-90",
                                                item.color
                                            )}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-sm text-navy uppercase tracking-tight">
                                                {item.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-navy/5 bg-beige/30">
                        <div className="flex items-center gap-4 opacity-40">
                            <div className="h-8 w-8 rounded-full bg-navy/10 flex items-center justify-center">
                                <ShieldAlert className="w-4 h-4 text-navy" />
                            </div>
                            <p className="text-[10px] font-bold text-navy uppercase leading-tight">
                                {currentLanguage === 'es'
                                    ? 'Soporte 24/7 disponible via Chat IA'
                                    : '24/7 Support available via AI Chat'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
