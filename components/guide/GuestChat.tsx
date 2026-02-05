'use client';

import { useChat } from 'ai/react'
import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, User, Sparkles, MessageCircle, MessageSquare, Phone } from 'lucide-react'
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

    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/chat',
        body: { propertyId },
    })

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        const handleOpenWithQuery = (e: any) => {
            setIsOpen(true);
            if (e.detail?.query) {
                append({ role: 'user', content: e.detail.query });
            }
        };

        window.addEventListener('open-guest-chat', handleOpenChat);
        window.addEventListener('open-guest-chat-with-query', handleOpenWithQuery);

        return () => {
            window.removeEventListener('open-guest-chat', handleOpenChat);
            window.removeEventListener('open-guest-chat-with-query', handleOpenWithQuery);
        };
    }, [append]);

    const scrollEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Auto-greeting logic (First Message)
    useEffect(() => {
        if (isOpen && messages.length === 0 && !isLoading) {
            // Short delay for natural feel
            const timer = setTimeout(() => {
                append({
                    id: 'welcome-msg',
                    role: 'assistant',
                    content: currentLanguage === 'es'
                        ? `Hola 👋\nYa tengo toda la información de este alojamiento.\n\n¿En qué puedo ayudarte ahora?`
                        : `Hello 👋\nI already have all the information for this accommodation.\n\nHow can I help you now?`
                });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isOpen, messages.length, isLoading, append, propertyName, currentLanguage]);

    const { content: onlineStatus } = useLocalizedContent('DISPONIBLE AHORA', currentLanguage, 'ui_label');
    const { content: faqLabel } = useLocalizedContent('PUEDO AYUDARTE CON:', currentLanguage, 'ui_label');
    const { content: emptyTitle } = useLocalizedContent('¿Qué necesitas ahora?', currentLanguage, 'ui_label');
    const { content: emptySubtitle } = useLocalizedContent(
        currentLanguage === 'es' ? 'Ya conozco este apartamento por dentro y por fuera.' : 'I know this apartment inside and out.',
        currentLanguage,
        'ui_label'
    );

    const quickReplies = [
        '¿Cómo funciona la lavadora?',
        '¿Dónde puedo cenar cerca?',
        '¿Cuál es la contraseña del WiFi?',
        '¿A qué hora es el check-out?'
    ];

    useEffect(() => {
        if (scrollContainerRef.current && isOpen) {
            const container = scrollContainerRef.current;
            // Si está cargando (streaming de Gemini), usamos scroll instantáneo directo para evitar rebotes
            // Si no está cargando, usamos scroll suave
            const scrollOptions: ScrollToOptions = {
                top: container.scrollHeight,
                behavior: isLoading ? 'auto' : 'smooth'
            };

            // Usamos un pequeño delay para asegurar que el DOM ha calculado el nuevo height del mensaje
            const timeoutId = setTimeout(() => {
                container.scrollTo(scrollOptions);
            }, 0);

            return () => clearTimeout(timeoutId);
        }
    }, [messages, isLoading, isOpen])

    return (
        <>
            {/* Floating Chat Trigger - Restored as FAB */}
            {
                !isOpen && (
                    <button
                        onClick={() => {
                            setIsOpen(true);
                            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                                window.navigator.vibrate([50, 30, 50]);
                            }
                        }}
                        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50 animate-in fade-in zoom-in slide-in-from-bottom-5 duration-500"
                        aria-label="Abrir asistente de ayuda"
                    >
                        <div className="relative">
                            <Bot className="w-7 h-7" strokeWidth={2.5} />
                            {/* Status Pulse */}
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                        </div>
                    </button>
                )
            }

            {/* Chat Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-all duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Chat Container */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] h-[85vh] sm:h-[680px] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl z-50 flex flex-col transition-all duration-300 transform overflow-hidden",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 sm:scale-95 opacity-0 pointer-events-none"
                )}
            >
                {/* Header Section */}
                <div className="bg-primary text-white px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-serif text-xl font-bold tracking-tight">
                                        {currentLanguage === 'es' ? 'Asistente de' : 'Assistant for'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/10 shrink-0 whitespace-nowrap">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{onlineStatus}</span>
                                    </div>
                                </div>
                                <p className="text-white/60 text-xs font-medium mt-0.5">{propertyName}</p>
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
                    <Bot className="w-4 h-4 text-primary/40" />
                    <span className="text-[10px] font-black text-primary/50 uppercase tracking-[0.25em]">EXPERTO EN {propertyName.toUpperCase()}</span>
                </div>

                {/* Main Content Area */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto bg-white relative"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-start pt-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                            {/* Empty State Icon */}
                            <div className="w-28 h-28 bg-stone-50 rounded-full flex items-center justify-center mb-10 relative">
                                <div className="absolute inset-0 bg-stone-100/50 rounded-full scale-110 animate-pulse" />
                                <Bot className="w-12 h-12 text-primary/30 relative" />
                            </div>

                            {/* Empty State Text */}
                            <h4 className="text-[22px] font-bold text-primary mb-4 px-10 leading-tight font-serif tracking-tight">
                                {emptyTitle}
                            </h4>
                            <p className="text-sm text-slate px-14 leading-relaxed font-medium">
                                {emptySubtitle}
                            </p>

                            {/* FAQ Section (Stacked as requested) */}
                            <div className="w-full px-6 mt-16 text-left">
                                <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center sm:text-left">
                                    {faqLabel}
                                </p>
                                <div className="flex flex-col gap-3">
                                    {quickReplies.map((reply, i) => (
                                        <button
                                            key={i}
                                            onClick={() => append({ role: 'user', content: reply })}
                                            className="w-full text-[13px] bg-white text-primary/80 px-6 py-3.5 rounded-2xl border border-stone-100 hover:border-primary/20 hover:bg-stone-50 transition-all text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] font-semibold"
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
                                            m.role === 'user' ? "bg-stone-100 text-primary" : "bg-primary text-white text-[10px]"
                                        )}>
                                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={cn(
                                            "px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed",
                                            m.role === 'user'
                                                ? "bg-primary text-white rounded-br-none shadow-md font-medium"
                                                : "bg-stone-50 text-primary/90 rounded-bl-none border border-stone-100"
                                        )}>
                                            <div className="prose prose-sm max-w-none prose-slate">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        a: ({ node, href, children, ...props }) => {
                                                            if (href?.startsWith('tel_wa:')) {
                                                                const num = href.split(':')[1];
                                                                const cleanNum = num.replace(/\D/g, '');
                                                                return (
                                                                    <span className="inline-flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 font-bold text-primary">
                                                                        {children}
                                                                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-primary/20">
                                                                            <a
                                                                                href={`tel:${num}`}
                                                                                className="p-1 hover:bg-primary/10 rounded-md transition-colors"
                                                                                title="Llamar"
                                                                            >
                                                                                <Phone className="w-3.5 h-3.5" />
                                                                            </a>
                                                                            <a
                                                                                href={`https://wa.me/${cleanNum}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="p-1 hover:bg-green-50 rounded-md transition-colors text-green-600"
                                                                                title="WhatsApp"
                                                                            >
                                                                                <MessageCircle className="w-3.5 h-3.5" />
                                                                            </a>
                                                                        </div>
                                                                    </span>
                                                                );
                                                            }
                                                            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                                        }
                                                    }}
                                                >
                                                    {m.content.replace(/(?<!\d|\[)(\+?\d{9,15})(?!\d|\])/g, '[$1](tel_wa:$1)')}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="flex items-end gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="bg-stone-50 px-5 py-4 rounded-2xl rounded-bl-none border border-stone-100">
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:150ms]" />
                                                <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:300ms]" />
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
                            className="w-full bg-stone-50 border-none rounded-2xl h-14 pl-5 pr-14 focus-visible:ring-2 focus-visible:ring-primary/5 text-sm font-medium placeholder:text-slate-400 transition-all focus:bg-white focus:shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 h-10 w-10 bg-primary/10 text-primary rounded-xl transition-all scale-100 active:scale-90 disabled:opacity-20 flex items-center justify-center hover:bg-primary hover:text-white"
                        >
                            <Send className="w-5 h-5 transition-transform" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-300 mt-5 uppercase tracking-[0.3em] font-black">
                        HOSTBOT POWERED BY GEMINI 2.0 FLASH
                    </p>
                </div>
            </div>
        </>
    )
}
