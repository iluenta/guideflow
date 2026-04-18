'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Plus, Trash2, Sparkles, HelpCircle, Loader2 } from 'lucide-react'
import { useWizard } from '../../WizardContext'

export default function StepFaqs({ value }: { value?: string }) {
    const {
        data,
        setData,
        aiLoading,
        handleAIFill
    } = useWizard()

    const updateFaq = (idx: number, field: string, value: string) => {
        const newFaqs = [...data.faqs]
        newFaqs[idx] = { ...newFaqs[idx], [field]: value }
        setData({ ...data, faqs: newFaqs })
    }

    const removeFaq = (idx: number) => {
        const newFaqs = [...data.faqs]
        newFaqs.splice(idx, 1)
        setData({ ...data, faqs: newFaqs })
    }

    const addFaq = () => {
        setData({
            ...data,
            faqs: [...data.faqs, { question: '', answer: '', category: 'custom' }]
        })
    }

    return (
        <TabsContent value="faqs" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-6 space-y-4">

                    {/* Header + AI button */}
                    <div className="flex items-center justify-between gap-4 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center shrink-0">
                                <HelpCircle className="h-4 w-4 text-[#316263]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Preguntas frecuentes</p>
                                <p className="text-xs text-slate-400">Anticipa las dudas más comunes de tus huéspedes</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 rounded-xl border-[#316263]/20 text-[#316263] hover:bg-[#316263] hover:text-white font-semibold text-xs gap-2 transition-all shrink-0"
                            onClick={() => handleAIFill('faqs')}
                            disabled={aiLoading === 'faqs'}
                        >
                            {aiLoading === 'faqs'
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...</>
                                : <><Sparkles className="w-3.5 h-3.5" /> Auto-generar</>
                            }
                        </Button>
                    </div>

                    {/* FAQ items */}
                    {data.faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group overflow-hidden">
                            <div className="flex items-center gap-3 px-4 pt-4 pb-1">
                                <div className="h-6 w-6 rounded-lg bg-[#316263]/10 text-[#316263] flex items-center justify-center font-bold text-xs shrink-0">
                                    {idx + 1}
                                </div>
                                <Input
                                    placeholder="Escribe la pregunta…"
                                    value={faq.question ?? ''}
                                    onChange={e => updateFaq(idx, 'question', e.target.value)}
                                    className="font-semibold border-none bg-transparent focus-visible:ring-0 px-0 h-9 text-sm text-slate-900 flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 lg:opacity-0 lg:group-hover:opacity-100"
                                    onClick={() => removeFaq(idx)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="px-4 pb-4">
                                <Textarea
                                    placeholder="Escribe la respuesta…"
                                    value={faq.answer ?? ''}
                                    onChange={e => updateFaq(idx, 'answer', e.target.value)}
                                    className="border-none bg-transparent focus-visible:ring-0 px-0 min-h-[80px] text-xs font-medium text-slate-500 leading-relaxed resize-none"
                                />
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        className="w-full h-12 border-dashed border-2 rounded-xl hover:bg-slate-50 text-slate-400 font-bold text-xs transition-all gap-2"
                        onClick={addFaq}
                    >
                        <Plus className="w-4 h-4" /> Añadir pregunta
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
