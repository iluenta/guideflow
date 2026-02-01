'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, UtensilsCrossed, MapPin, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatOnboardingProps {
    onOpenChat: () => void;
}

export function ChatOnboarding({ onOpenChat }: ChatOnboardingProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Check if already seen
        const hasSeenOnboarding = localStorage.getItem('chatOnboardingSeen');
        if (!hasSeenOnboarding) {
            // Show after a short delay for smooth entrance
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);

            // Stagger content animation
            const contentTimer = setTimeout(() => {
                setShowContent(true);
            }, 1800);

            // Auto close after 10 seconds (as per prototype code)
            const autoCloseTimer = setTimeout(() => {
                handleClose();
            }, 10000);

            return () => {
                clearTimeout(timer);
                clearTimeout(contentTimer);
                clearTimeout(autoCloseTimer);
            };
        }
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem('chatOnboardingSeen', 'true');
        }, 400);
    };

    const handleOpenChat = () => {
        handleClose();
        setTimeout(() => {
            onOpenChat();
        }, 400);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[60] flex items-center justify-center px-5 transition-all duration-400",
                isClosing ? "opacity-0" : "opacity-100"
            )}
        >
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity duration-500",
                    isClosing ? "opacity-0" : "opacity-100"
                )}
                onClick={handleClose}
            />

            {/* Modal Card */}
            <div
                className={cn(
                    "relative w-full max-w-[360px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all duration-400",
                    isClosing ? "scale-90 translate-y-8 opacity-0" : "scale-100 translate-y-0 opacity-100"
                )}
            >
                {/* Decorative top accent */}
                <div className="h-1.5 bg-gradient-to-r from-navy via-navy-light to-navy" />

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full bg-stone-100/50 hover:bg-stone-100 flex items-center justify-center text-slate hover:text-navy transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="px-8 pt-10 pb-8">
                    {/* Welcome Section */}
                    <div
                        className={cn(
                            "text-center mb-8 transition-all duration-500 delay-100",
                            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        )}
                    >
                        {/* Friendly wave emoji */}
                        <div className="text-6xl mb-4 inline-block animate-wave">
                            👋
                        </div>

                        <h2 className="font-serif text-3xl text-navy font-bold mb-3 tracking-tight">
                            ¡Bienvenido!
                        </h2>
                        <p className="text-slate text-[15px] leading-relaxed font-medium">
                            Soy tu asistente virtual.
                            <br />
                            Estoy aquí para ayudarte durante tu estancia.
                        </p>
                    </div>

                    {/* Example Questions/Suggestions */}
                    <div
                        className={cn(
                            "space-y-3 mb-8 transition-all duration-500 delay-200",
                            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        )}
                    >
                        <p className="text-[10px] text-navy/40 font-black uppercase tracking-[0.25em] text-center mb-4">
                            PREGÚNTAME COSAS COMO
                        </p>

                        <button
                            onClick={handleOpenChat}
                            className="w-full bg-stone-50/50 hover:bg-stone-50 p-4 rounded-2xl flex items-center gap-4 transition-all text-left group border border-stone-100/50 active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-navy font-bold">
                                "¿Cómo funciona el horno?"
                            </span>
                        </button>

                        <button
                            onClick={handleOpenChat}
                            className="w-full bg-stone-50/50 hover:bg-stone-50 p-4 rounded-2xl flex items-center gap-4 transition-all text-left group border border-stone-100/50 active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                <UtensilsCrossed className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-navy font-bold">
                                "¿Dónde puedo cenar bien?"
                            </span>
                        </button>

                        <button
                            onClick={handleOpenChat}
                            className="w-full bg-stone-50/50 hover:bg-stone-50 p-4 rounded-2xl flex items-center gap-4 transition-all text-left group border border-stone-100/50 active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-navy font-bold">
                                "¿Cómo llego al centro?"
                            </span>
                        </button>
                    </div>

                    {/* Status */}
                    <div
                        className={cn(
                            "flex items-center justify-center gap-2.5 mb-8 transition-all duration-500 delay-300",
                            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        )}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] text-emerald-600 font-black uppercase tracking-widest">
                            Disponible 24/7
                        </span>
                    </div>

                    {/* Final Actions */}
                    <div
                        className={cn(
                            "space-y-3 transition-all duration-500 delay-400",
                            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        )}
                    >
                        <button
                            onClick={handleOpenChat}
                            className="w-full bg-navy hover:bg-navy-light text-white py-4.5 rounded-[1.25rem] font-bold shadow-xl shadow-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                        >
                            <Sparkles className="w-4.5 h-4.5" />
                            Hacer una pregunta
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full py-2 text-slate-400 hover:text-navy text-sm font-bold transition-colors tracking-tight"
                        >
                            Explorar la guía primero
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
