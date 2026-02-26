'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BookText, ChevronRight, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { useLocalizedContent } from '@/hooks/useLocalizedContent'

interface Manual {
    id: string
    appliance_name: string
    brand: string
    model: string
    manual_content: string
}

interface ManualsListProps {
    manuals: Manual[]
    currentLanguage?: string
}

export function ManualsList({ manuals, currentLanguage = 'es' }: ManualsListProps) {
    if (!manuals || manuals.length === 0) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
                <LocalizedLabel
                    text="Manuales de Aparatos"
                    language={currentLanguage}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400"
                />
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>

            <div className="grid gap-4">
                {manuals.map((manual) => (
                    <ManualItem key={manual.id} manual={manual} language={currentLanguage} />
                ))}
            </div>
        </div>
    )
}

function LocalizedLabel({ text, language, className }: { text: string, language: string, className?: string }) {
    const { content } = useLocalizedContent(text, language, 'ui_label');
    return <h2 className={className}>{content}</h2>;
}

function ManualItem({ manual, language }: { manual: Manual, language: string }) {
    const { content: localizedName, isTranslating: nameLoading } = useLocalizedContent(manual.appliance_name, language, 'appliance_name');
    const { content: localizedContent, isTranslating: contentLoading } = useLocalizedContent(manual.manual_content, language, 'manual_content');
    const { content: officialLabel } = useLocalizedContent("Manual Oficial", language, 'ui_label');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="w-full text-left group">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-[2rem] overflow-hidden group-active:scale-[0.98]">
                        <div className="flex items-center p-6 gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-500 shrink-0">
                                <BookText className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-slate-900 truncate ${nameLoading ? 'animate-pulse opacity-50' : ''}`}>
                                    {localizedName}
                                </h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                    {manual.brand} {manual.model}
                                </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                        </div>
                    </Card>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-6 border-b border-slate-100">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{officialLabel}</span>
                        </div>
                        <DialogTitle className={`text-2xl font-black text-slate-900 ${nameLoading ? 'animate-pulse opacity-50' : ''}`}>
                            {localizedName} - {manual.brand} {manual.model}
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <div className={`p-8 prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:font-bold ${contentLoading ? 'animate-pulse opacity-50' : ''}`}>
                    <ReactMarkdown>{localizedContent}</ReactMarkdown>
                </div>
            </DialogContent>
        </Dialog>
    );
}
