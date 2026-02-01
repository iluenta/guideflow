'use client';

import { useChat } from 'ai/react'
import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface GuestChatProps {
    propertyId: string
    propertyName: string
    currentLanguage?: string
}

export function GuestChat({ propertyId, propertyName, currentLanguage = 'es' }: GuestChatProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-guest-chat', handleOpenChat);
        return () => window.removeEventListener('open-guest-chat', handleOpenChat);
    }, []);

    const scrollEndRef = useRef<HTMLDivElement>(null)
    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/chat',
        body: { propertyId },
    })

    const { content: onlineStatus } = useLocalizedContent('EN LÍNEA', currentLanguage, 'ui_label');
    const { content: faqLabel } = useLocalizedContent('PREGUNTAS FRECUENTES:', currentLanguage, 'ui_label');
    const { content: emptyTitle } = useLocalizedContent('¿En qué puedo ayudarte hoy?', currentLanguage, 'ui_label');
    const { content: emptySubtitle } = useLocalizedContent('Pregúntame sobre cómo usar el horno, la clave del wifi o dónde está el termo.', currentLanguage, 'ui_label');

    const quickReplies = [
        '¿Cómo funciona la lavadora?',
        '¿Dónde puedo cenar cerca?',
        '¿Cuál es la contraseña del WiFi?',
        '¿A qué hora es el check-out?'
    ];

    useEffect(() => {
        if (scrollEndRef.current && isOpen) {
            scrollEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isLoading, isOpen])

    return (
        <>
            {/* Chat Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-all duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Chat Container (Exact match to uploaded_media_1769952613433.png) */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] h-[85vh] sm:h-[680px] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl z-50 flex flex-col transition-all duration-300 transform overflow-hidden",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 sm:scale-95 opacity-0 pointer-events-none"
                )}
            >
                {/* Header Section */}
                <div className="bg-navy text-white px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-serif text-xl font-bold tracking-tight">HostBot AI</h3>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-green-400">{onlineStatus}</span>
                                    </div>
                                </div>
                                <p className="text-white/60 text-xs font-medium mt-0.5">{propertyName} Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Subheader (Expert Bar) */}
                <div className="bg-white px-6 py-3 border-b border-stone-50 flex items-center gap-3 shrink-0 shadow-sm z-10">
                    <Sparkles className="w-4 h-4 text-navy/40" />
                    <span className="text-[10px] font-black text-navy/50 uppercase tracking-[0.25em]">EXPERTO EN {propertyName.toUpperCase()}</span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-white scroll-smooth relative">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-start pt-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                            {/* Empty State Icon */}
                            <div className="w-28 h-28 bg-stone-50 rounded-full flex items-center justify-center mb-10 relative">
                                <div className="absolute inset-0 bg-stone-100/50 rounded-full scale-110 animate-pulse" />
                                <Sparkles className="w-12 h-12 text-navy/30 relative" />
                            </div>

                            {/* Empty State Text */}
                            <h4 className="text-[22px] font-bold text-navy mb-4 px-10 leading-tight font-serif tracking-tight">
                                {emptyTitle}
                            </h4>
                            <p className="text-sm text-slate px-14 leading-relaxed font-medium">
                                {emptySubtitle}
                            </p>

                            {/* FAQ Section (Stacked as requested) */}
                            <div className="w-full px-6 mt-16 text-left">
                                <p className="text-navy/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center sm:text-left">
                                    {faqLabel}
                                </p>
                                <div className="flex flex-col gap-3">
                                    {quickReplies.map((reply, i) => (
                                        <button
                                            key={i}
                                            onClick={() => append({ role: 'user', content: reply })}
                                            className="w-full text-[13px] bg-white text-navy/80 px-6 py-3.5 rounded-2xl border border-stone-100 hover:border-navy/20 hover:bg-stone-50 transition-all text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] font-semibold"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        m.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-end gap-3 max-w-[85%]",
                                        m.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                            m.role === 'user' ? "bg-stone-100 text-navy" : "bg-navy text-white text-[10px]"
                                        )}>
                                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={cn(
                                            "px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed",
                                            m.role === 'user'
                                                ? "bg-navy text-white rounded-br-none shadow-md font-medium"
                                                : "bg-stone-50 text-navy/90 rounded-bl-none border border-stone-100"
                                        )}>
                                            <div className="prose prose-sm max-w-none prose-slate">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="flex items-end gap-3">
                                        <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="bg-stone-50 px-5 py-4 rounded-2xl rounded-bl-none border border-stone-100">
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-navy/20 rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-navy/20 rounded-full animate-bounce [animation-delay:150ms]" />
                                                <div className="w-1.5 h-1.5 bg-navy/20 rounded-full animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={scrollEndRef} className="h-10" />
                </div>

                {/* Footer Input Area */}
                <div className="px-6 pb-6 pt-4 bg-white/95 backdrop-blur-sm border-t border-stone-50 shrink-0">
                    <form onSubmit={handleSubmit} className="relative group">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Escribe tu duda aquí..."
                            className="w-full bg-stone-50 border-none rounded-2xl h-14 pl-5 pr-14 focus-visible:ring-2 focus-visible:ring-navy/5 text-sm font-medium placeholder:text-slate-400 transition-all focus:bg-white focus:shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 h-10 w-10 bg-blue-100/50 text-navy rounded-xl transition-all scale-100 active:scale-90 disabled:opacity-20 flex items-center justify-center hover:bg-navy hover:text-white"
                        >
                            <Send className="w-5 h-5 transition-transform" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-300 mt-5 uppercase tracking-[0.3em] font-black">
                        HOSTBOT POWERED BY GEMINI 3 FLASH
                    </p>
                </div>
            </div>
        </>
    )
}
