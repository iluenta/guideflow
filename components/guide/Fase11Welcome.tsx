'use client';

import React from 'react';
import { Variants, motion } from 'framer-motion';
import {
    Search,
    Wifi,
    Utensils,
    Key,
    MapPin,
    ChevronRight,
    Sparkles,
    ArrowRight
} from 'lucide-react';

interface Fase11WelcomeProps {
    propertyName: string;
    heroImage: string;
    location: string;
    onOpenGuide: () => void;
    onNavigate: (page: string) => void;
    onChatQuery: (query: string) => void;
    currentLanguage?: string;
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 50
        }
    }
};

export function Fase11Welcome({
    propertyName,
    heroImage,
    location,
    onOpenGuide,
    onNavigate,
    onChatQuery,
    currentLanguage = 'es'
}: Fase11WelcomeProps) {
    return (
        <motion.div
            className="flex flex-col min-h-full bg-white relative"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Hero Section */}
            <div className="relative h-[45vh] w-full overflow-hidden">
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    src={heroImage}
                    alt={propertyName}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 pb-12 text-white">
                    <motion.div variants={item}>
                        <p className="text-sm font-medium tracking-widest uppercase opacity-90 mb-2 flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-400" />
                            {currentLanguage === 'es' ? 'Bienvenido a casa' : 'Welcome home'}
                        </p>
                        <h1 className="text-4xl font-bold mb-1 font-serif leading-tight">
                            {currentLanguage === 'es' ? 'Hola' : 'Hello'}
                        </h1>
                        <p className="text-lg opacity-90 font-light italic font-serif">
                            {propertyName}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Container - Overlapping Hero */}
            <div className="flex-1 px-6 -mt-8 relative z-10 pb-8">
                {/* Search Bar - Links to Chat */}
                <motion.div variants={item} className="mb-8">
                    <div
                        className="relative group shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-2xl bg-white overflow-hidden cursor-pointer"
                        onClick={() => onChatQuery('')}
                    >
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
                            <Search size={20} />
                        </div>
                        <div className="w-full h-16 pl-12 pr-14 bg-white flex items-center text-gray-400 text-base">
                            {currentLanguage === 'es' ? '¿En qué puedo ayudarte hoy?' : 'How can I help you today?'}
                        </div>

                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <button
                                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white transition-transform active:scale-95"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3 font-medium uppercase tracking-[0.1em]">
                        {currentLanguage === 'es' ? 'Tu concierge digital en' : 'Your digital concierge in'} {location}
                    </p>
                </motion.div>

                {/* Quick Actions - FAQs */}
                <motion.div variants={item} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {currentLanguage === 'es' ? 'Preguntas Frecuentes' : 'Common Questions'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'wifi', icon: Wifi, label: currentLanguage === 'es' ? 'WiFi' : 'WiFi', type: 'nav', target: 'wifi' },
                            { id: 'access', icon: Key, label: currentLanguage === 'es' ? 'Acceso' : 'Access', type: 'nav', target: 'checkin' },
                            { id: 'parking', icon: MapPin, label: currentLanguage === 'es' ? 'Parking' : 'Parking', type: 'chat', query: currentLanguage === 'es' ? '¿Dónde puedo aparcar?' : 'Where can I park?' },
                            { id: 'eat', icon: Utensils, label: currentLanguage === 'es' ? 'Comer' : 'Food', type: 'chat', query: currentLanguage === 'es' ? '¿Dónde puedo comer cerca?' : 'Where can I eat nearby?' }
                        ].map((chip) => (
                            <button
                                key={chip.id}
                                onClick={() => chip.type === 'nav' ? onNavigate(chip.target!) : onChatQuery(chip.query!)}
                                className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors text-left group border border-gray-100/50"
                            >
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <chip.icon size={16} />
                                </div>
                                <span className="text-sm font-bold text-gray-700">{chip.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Guide Link Card */}
                <motion.div variants={item} className="mt-auto">
                    <div
                        className="rounded-2xl p-1 relative overflow-hidden group cursor-pointer"
                        onClick={onOpenGuide}
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.05), white)'
                        }}
                    >
                        <div className="bg-white rounded-xl p-5 border border-primary/5 relative z-10 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] mb-1">
                                    {currentLanguage === 'es' ? 'Tu Estancia' : 'Your Stay'}
                                </p>
                                <h3 className="text-xl font-serif font-bold text-gray-900 mb-1">
                                    {currentLanguage === 'es' ? 'Guía de la Casa' : 'House Guide'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {currentLanguage === 'es' ? 'Todo lo que necesitas saber' : 'Everything you need to know'}
                                </p>
                            </div>
                            <div
                                className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-110"
                            >
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div variants={item} className="mt-8 text-center">
                    <p className="text-[9px] font-black text-gray-300 tracking-[0.4em] uppercase">
                        Powered by GuideFlow
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
