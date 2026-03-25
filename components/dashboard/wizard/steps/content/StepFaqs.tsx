'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Plus, Trash2, Sparkles } from 'lucide-react'
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
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-end mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-[10px] font-bold uppercase tracking-wider border-slate-200 rounded-xl hover:bg-[#316263] hover:text-white transition-all"
                            onClick={() => handleAIFill('faqs')}
                            disabled={aiLoading === 'faqs'}
                        >
                            {aiLoading === 'faqs' ? 'Generando...' : <><Sparkles className="w-3 w-3 mr-2" /> Auto-generar</>}
                        </Button>
                    </div>
                    {data.faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="space-y-4 p-5 rounded-xl border border-slate-100 bg-slate-50/50 transition-all hover:bg-white hover:shadow-md group animate-in slide-in-from-right-2 duration-200">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-4 text-left">
                                    <Input
                                        placeholder="Pregunta"
                                        value={faq.question ?? ''}
                                        onChange={e => updateFaq(idx, 'question', e.target.value)}
                                        className="font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-10 text-base text-slate-900"
                                    />
                                    <Textarea
                                        placeholder="Respuesta..."
                                        value={faq.answer ?? ''}
                                        onChange={e => updateFaq(idx, 'answer', e.target.value)}
                                        className="border-none bg-transparent focus-visible:ring-0 px-0 min-h-[100px] text-xs font-medium text-slate-500 leading-relaxed"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-start"
                                    onClick={() => removeFaq(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        className="w-full h-12 border-dashed border-2 rounded-xl hover:bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest transition-all"
                        onClick={addFaq}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Añadir Sección a la Guía
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
