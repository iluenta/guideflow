'use client'

import { useChat } from 'ai/react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, X, MessageCircle, Bot, User, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface GuestChatProps {
    propertyId: string
    propertyName: string
}

export function GuestChat({ propertyId, propertyName }: GuestChatProps) {
    const [isOpen, setIsOpen] = useState(false)
    const scrollEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: { propertyId },
    })

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollEndRef.current && isOpen) {
            scrollEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isLoading, isOpen])

    return (
        <>
            {/* Floating Toggle Button */}
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 transition-all duration-300 scale-100 hover:scale-110 active:scale-95",
                    isOpen ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100"
                )}
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white"></span>
                </span>
            </Button>

            {/* Chat Container */}
            <div
                className={cn(
                    "fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] bg-white sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-50 flex flex-col transition-all duration-500 transform overflow-hidden border border-slate-100",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-10 opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-sm tracking-tight leading-none mb-1">HostBot AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Info Bar */}
                <div className="bg-slate-50 px-6 py-2 border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Experto en {propertyName}
                </div>

                {/* Messages Area - USANDO SCROLL NATIVO PARA MÁXIMA COMPATIBILIDAD */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                >
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-slate-200" />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-black text-sm">¿En qué puedo ayudarte hoy?</p>
                                    <p className="text-slate-400 text-xs px-8 mt-1">Pregúntame sobre cómo usar el horno, la clave del wifi o dónde está el termo.</p>
                                </div>
                            </div>
                        )}

                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    m.role === 'user' ? "bg-slate-100" : "bg-primary text-white"
                                )}>
                                    {m.role === 'user' ? <User className="h-4 w-4 text-slate-400" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    "max-w-[85%] rounded-[1.5rem] p-4 text-sm leading-relaxed",
                                    m.role === 'user' ? "bg-slate-100 text-slate-900 rounded-tr-none font-medium" : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-none"
                                )}>
                                    {m.role === 'user' ? (
                                        m.content
                                    ) : (
                                        <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:p-2 prose-pre:rounded-lg prose-table:border prose-table:border-slate-100 prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-td:border-t prose-table:my-4 prose-table:block prose-table:overflow-x-auto prose-table:whitespace-nowrap prose-table:text-[10px] sm:prose-table:text-xs scrollbar-thin scrollbar-thumb-slate-200">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-slate-300" />
                                </div>
                                <div className="bg-slate-50 rounded-[1.5rem] rounded-tl-none p-4 w-16 h-10 flex items-center justify-center gap-1">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollEndRef} className="h-4" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSubmit} className="relative group">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Escribe tu duda aquí..."
                            className="w-full bg-slate-50 border-none rounded-2xl h-12 pl-4 pr-12 focus-visible:ring-primary focus-visible:ring-offset-0 text-sm font-medium placeholder:text-slate-400 transition-all group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:ring-1 group-focus-within:ring-slate-100"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl shadow-lg transition-all scale-100 active:scale-90 disabled:opacity-50 disabled:scale-100"
                            style={{ backgroundColor: 'var(--primary)' }}
                        >
                            <Send className="h-4 w-4 text-white" />
                        </Button>
                    </form>
                    <p className="text-center text-[9px] text-slate-300 mt-4 uppercase tracking-widest font-black">
                        HostBot powered by Gemini 3 Flash
                    </p>
                </div>
            </div >
        </>
    )
}
