'use client';

import { useChat } from 'ai/react'
import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, User, Sparkles, MessageCircle, MessageSquare, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface GuestChatProps {
    propertyId: string
    propertyName: string
    currentLanguage?: string
    accessToken?: string
    initialOpen?: boolean
    initialQuery?: string
    guestSessionId?: string
}

function QuickReplyButton({
    reply,
    currentLanguage,
    accessToken,
    propertyId, // FASE 17
    onClick
}: {
    reply: string,
    currentLanguage: string,
    accessToken?: string,
    propertyId?: string, // FASE 17
    onClick: (reply: string) => void
}) {
    const { content: localizedReply } = useLocalizedContent(reply, currentLanguage, 'chat_quick_reply', accessToken, propertyId);

    return (
        <button
            onClick={() => onClick(localizedReply)}
            className="w-full text-[12px] bg-white text-primary/80 px-4 py-3 rounded-2xl border border-stone-100 hover:border-primary/20 hover:bg-stone-50 transition-all text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] font-bold leading-tight"
        >
            {localizedReply}
        </button>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for iOS Safari which might block clipboard implicitly 
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[13px] border transition-all cursor-pointer active:scale-95 select-all",
                copied
                    ? "bg-green-50 text-green-700 border-green-300"
                    : "bg-primary/5 text-primary border-primary/15 hover:bg-primary/10"
            )}
            title="Tocar para copiar"
        >
            {copied ? (
                <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copiado</span>
                </>
            ) : (
                <>
                    <span>{text}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                </>
            )}
        </button>
    );
}

const WIFI_EXCLUDED = new Set([
    'wifi', 'red', 'ssid', 'es', 'la', 'el', 'un', 'una',
    'contraseña', 'password', 'clave', 'network', 'internet',
    'siguiente', 'esta', 'aqui', 'aquí', 'the', 'is', 'are'
]);

function injectWifiMarkers(content: string): string {
    // Si ya hay backticks (Gemini los emitió) → convertirlos a [[COPY:...]]
    content = content.replace(/`([^`\n]{2,50})`/g, (_m, val) => {
        if (WIFI_EXCLUDED.has(val.toLowerCase())) return val;
        return `[[COPY:${val}]]`;
    });

    // Detectar patrón semántico: "red: VALOR", "contraseña: VALOR", "red es VALOR", etc.
    content = content.replace(
        /\b(?:red(?:\s+wifi)?|ssid|contrase[ñn]a|password|clave)(?:\s*:\s*|\s+es\s+|\s+wifi\s+es\s+)([^\s`\[\],.\n]{4,50})/gi,
        (match, value) => {
            if (WIFI_EXCLUDED.has(value.toLowerCase())) return match;
            return match.replace(value, `[[COPY:${value}]]`);
        }
    );

    return content;
}

export function GuestChat({ propertyId, propertyName, currentLanguage = 'es', accessToken, initialOpen = false, initialQuery, guestSessionId: propGuestSessionId }: GuestChatProps) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [internalGuestSessionId, setInternalGuestSessionId] = useState('');

    useEffect(() => {
        let sid = localStorage.getItem('guideflow_guest_session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            localStorage.setItem('guideflow_guest_session_id', sid);
        }
        setInternalGuestSessionId(sid);
    }, []);

    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/chat',
        body: {
            propertyId,
            language: currentLanguage,
            accessToken,
            guestSessionId: propGuestSessionId || internalGuestSessionId
        },
    })

    useEffect(() => {
        if (initialQuery) {
            append({ role: 'user', content: initialQuery });
        }
    }, [initialQuery, append]);

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

    const { content: onlineStatus } = useLocalizedContent('DISPONIBLE AHORA', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: faqLabel } = useLocalizedContent('PUEDO AYUDARTE CON:', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: emptyTitle } = useLocalizedContent('¿Qué necesitas ahora?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: emptySubtitle } = useLocalizedContent(
        'Ya conozco este apartamento por dentro y por fuera.',
        currentLanguage,
        'ui_label',
        accessToken,
        propertyId
    );
    const { content: assistantLabel } = useLocalizedContent('Asistente Virtual', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: expertLabel } = useLocalizedContent('EXPERTO EN', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: placeholderLabel } = useLocalizedContent('Escribe tu duda aquí...', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: triggerAriaLabel } = useLocalizedContent('Abrir asistente de ayuda', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: callTitle } = useLocalizedContent('Llamar', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: whatsappTitle } = useLocalizedContent('WhatsApp', currentLanguage, 'ui_label', accessToken, propertyId);

    const quickReplies = [
        '¿Cómo funciona la lavadora?',
        '¿Dónde puedo cenar cerca?',
        '¿Cuál es la contraseña del WiFi?',
        '¿A qué hora es el check-out?'
    ];

    useEffect(() => {
        if (scrollContainerRef.current && isOpen) {
            const container = scrollContainerRef.current;
            const scrollOptions: ScrollToOptions = {
                top: container.scrollHeight,
                behavior: isLoading ? 'auto' : 'smooth'
            };

            const timeoutId = setTimeout(() => {
                container.scrollTo(scrollOptions);
            }, 0);

            return () => clearTimeout(timeoutId);
        }
    }, [messages, isLoading, isOpen])

    return (
        <>
            {/* Floating Chat Trigger */}
            {!isOpen && (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate([50, 30, 50]);
                        }
                    }}
                    className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-tr from-primary to-primary/80 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-4 ring-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50"
                    aria-label={triggerAriaLabel}
                >
                    <div className="relative">
                        <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                    </div>
                </button>
            )}

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
                    "fixed inset-x-0 bottom-[64px] sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] h-[calc(85vh-64px)] sm:h-[680px] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl z-50 flex flex-col transition-all duration-300 transform overflow-hidden",
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
                                        {assistantLabel}
                                    </h3>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/10 shrink-0 whitespace-nowrap">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{onlineStatus}</span>
                                    </div>
                                </div>
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

                {/* Subheader */}
                <div className="bg-white px-6 py-3 border-b border-stone-50 flex items-center gap-3 shrink-0 shadow-sm z-10">
                    <Bot className="w-4 h-4 text-primary/40" />
                    <span className="text-[10px] font-black text-primary/50 uppercase tracking-[0.25em]">{expertLabel} {propertyName.toUpperCase()}</span>
                </div>

                {/* Main Content Area */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto bg-white relative"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-start pt-4 pb-8 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                            {/* Empty State Icon */}
                            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 relative">
                                <div className="absolute inset-0 bg-stone-100/50 rounded-full scale-110 animate-pulse" />
                                <Bot className="w-8 h-8 text-primary/30 relative" />
                            </div>

                            {/* Empty State Text */}
                            <h4 className="text-[18px] font-bold text-primary mb-2 px-10 leading-tight font-serif tracking-tight">
                                {emptyTitle}
                            </h4>
                            <p className="text-[12px] text-slate px-12 leading-relaxed font-medium opacity-70">
                                {emptySubtitle}
                            </p>

                            {/* FAQ Section */}
                            <div className="w-full px-5 mt-6 text-left">
                                <p className="text-primary/40 text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-center">
                                    {faqLabel}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickReplies.map((reply, i) => (
                                        <QuickReplyButton
                                            key={i}
                                            reply={reply}
                                            currentLanguage={currentLanguage}
                                            accessToken={accessToken}
                                            propertyId={propertyId}
                                            onClick={(localizedContent) => append({ role: 'user', content: localizedContent })}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-6 space-y-6">
                            {messages.map((m) => {
                                const processedContent = injectWifiMarkers(m.content)
                                    // Strip out any hallucinated internal RAG citations (e.g. [[GUÍA_TÉCNICA: Hervidor]])
                                    .replace(/\[\[(?!COPY:|MAP:)[^\]]+\]\]/gi, '')
                                    .replace(/\[\[COPY:(.+?)\]\]/g, (_match, val) => `[${val}](copy:${encodeURIComponent(val)})`)
                                    .replace(/\[\[MAP:([^\]]+)\]\]/g, (_match, content) => {
                                        if (content.startsWith('PLACE_ID:')) {
                                            const withoutPrefix = content.slice('PLACE_ID:'.length)
                                            const parts = withoutPrefix.split(':')
                                            const placeId = parts[0].trim()
                                            const name    = parts[1]?.trim() || placeId
                                            return `[${name}](maps_place:${encodeURIComponent(placeId)})`
                                        }
                                        const parts = content.split(':')
                                        const address = parts[0].trim()
                                        const label = parts.length > 1 ? parts.slice(1).join(':').trim() : address
                                        return `[${label}](maps:${encodeURIComponent(address)})`
                                    })
                                    .replace(/(?<!\d|\[)(\+?\d{9,15})(?!\d|\])/g, '[$1](tel_wa:$1)');

                                return (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                            m.role === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-end gap-3 max-w-[92%]",
                                            m.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                                m.role === 'user' ? "bg-stone-100 text-primary" : "bg-primary text-white text-[10px]"
                                            )}>
                                                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                            </div>
                                            <div className={cn(
                                                "px-5 py-3.5 rounded-2xl text-[16px] leading-relaxed break-words [overflow-wrap:anywhere]",
                                                m.role === 'user'
                                                    ? "bg-primary text-white rounded-br-none shadow-md font-medium"
                                                    : "bg-stone-50 text-primary/90 rounded-bl-none border border-stone-100"
                                            )}>
                                                <div className="text-[16px] leading-relaxed max-w-full overflow-x-hidden [&_p]:mb-3 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-2">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        urlTransform={(url) => url}
                                                        components={{
                                                            a: ({ node, href, children, ...props }: any) => {
                                                                if (href?.startsWith('copy:')) {
                                                                    const value = decodeURIComponent(href.slice('copy:'.length));
                                                                    return <CopyButton text={value} />;
                                                                }
                                                                // tel_wa: — existing phone + WhatsApp button
                                                                if (href?.startsWith('tel_wa:')) {
                                                                    const num = href.split(':')[1];
                                                                    const cleanNum = num.replace(/\D/g, '');
                                                                    return (
                                                                        <span className="inline-flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 font-bold text-primary">
                                                                            {children}
                                                                            <span className="inline-flex items-center gap-1 ml-1 pl-1 border-l border-primary/20">
                                                                                <a
                                                                                    href={`tel:${num}`}
                                                                                    className="p-1 hover:bg-primary/10 rounded-md transition-colors inline-flex"
                                                                                    title={callTitle}
                                                                                >
                                                                                    <Phone className="w-3.5 h-3.5" />
                                                                                </a>
                                                                                <a
                                                                                    href={`https://wa.me/${cleanNum}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1 hover:bg-green-50 rounded-md transition-colors text-green-600 inline-flex"
                                                                                    title={whatsappTitle}
                                                                                >
                                                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                                                </a>
                                                                            </span>
                                                                        </span>
                                                                    );
                                                                }
                                                                // maps_place: — high-precision map pill using Place ID
                                                                if (href?.startsWith('maps_place:')) {
                                                                    const placeId = decodeURIComponent(href.slice('maps_place:'.length))
                                                                    const queryName = encodeURIComponent(String(children));
                                                                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${queryName}&query_place_id=${placeId}`

                                                                    return (
                                                                        <a
                                                                            href={mapsUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary font-bold underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-all"
                                                                        >
                                                                            {children}
                                                                        </a>
                                                                    );
                                                                }
                                                                // maps: — legacy map pill (Google Maps search)
                                                                if (href?.startsWith('maps:')) {
                                                                    const encodedAddress = href.slice('maps:'.length);
                                                                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                                                                    const label = decodeURIComponent(String(children));
                                                                    return (
                                                                        <a
                                                                            href={mapsUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ textDecoration: 'none' }}
                                                                            className="not-prose no-underline inline-block group"
                                                                        >
                                                                            <span className="inline-flex items-center gap-2 mt-1.5 pl-2 pr-3 py-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm cursor-pointer overflow-hidden max-w-full">
                                                                                <span className="w-5 h-5 rounded-full bg-[#EA4335] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                                                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
                                                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5-2.5z"/>
                                                                                    </svg>
                                                                                </span>
                                                                                <span className="text-[12px] font-semibold text-slate-700 leading-none truncate">
                                                                                    {label}
                                                                                </span>
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 shrink-0 group-hover:text-slate-400">
                                                                                    <polyline points="9 18 15 12 9 6"/>
                                                                                </svg>
                                                                            </span>
                                                                        </a>
                                                                    );
                                                                }
                                                                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                                            },
                                                            code: ({ node, inline, children, ...props }: any) => {
                                                                return <code {...props} className="bg-primary/5 text-primary px-1 rounded-sm">{children}</code>;
                                                            }
                                                        }}
                                                    >
                                                        {processedContent}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

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
                            placeholder={placeholderLabel}
                            className="w-full bg-stone-50 border-none rounded-2xl h-14 pl-5 pr-14 focus-visible:ring-2 focus-visible:ring-primary/5 text-[16px] font-medium placeholder:text-slate-400 transition-all focus:bg-white focus:shadow-sm"
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
    );
}
