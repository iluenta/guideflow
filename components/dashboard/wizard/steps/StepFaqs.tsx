'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { useWizard } from '../WizardContext'

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
        <TabsContent value="faqs" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center py-3 px-4">
                    <div>
                        <CardTitle className="text-base">Guía del Alojamiento</CardTitle>
                        <CardDescription className="text-xs">Anticípate a las dudas de tus huéspedes y explica cómo funciona todo.</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-[10px] font-bold uppercase tracking-wider"
                        onClick={() => handleAIFill('faqs')}
                        disabled={aiLoading === 'faqs'}
                    >
                        {aiLoading === 'faqs' ? 'Generando...' : <><Sparkles className="w-4 h-4 mr-2" /> Auto-generar Guía</>}
                    </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {data.faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="space-y-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-4">
                                    <Input
                                        placeholder="Pregunta"
                                        value={faq.question ?? ''}
                                        onChange={e => updateFaq(idx, 'question', e.target.value)}
                                        className="font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-11"
                                    />
                                    <Textarea
                                        placeholder="Respuesta..."
                                        value={faq.answer ?? ''}
                                        onChange={e => updateFaq(idx, 'answer', e.target.value)}
                                        className="border-none bg-transparent focus-visible:ring-0 px-0 min-h-[100px]"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-destructive"
                                    onClick={() => removeFaq(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="ghost"
                        className="w-full border-dashed border-2 hover:bg-primary/5"
                        onClick={addFaq}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Añadir Sección a la Guía
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
