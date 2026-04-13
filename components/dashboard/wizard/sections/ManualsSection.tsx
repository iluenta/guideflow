'use client'

import React, { useState } from 'react'
import {
    FileText, Sparkles, Trash2, Edit2, CheckCircle2,
    Droplets, ChefHat, Wind, Laptop, Lightbulb, Cpu,
    ChevronDown, ChevronUp, RefreshCcw, Save, X, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Manual {
    id: string
    appliance_name: string
    brand: string
    model: string
    manual_content: string
    updated_at: string
    created_at: string
    metadata?: {
        source?: string
        status?: 'pending' | 'reviewed' | 'edited'
        confidence?: string
        is_revised?: boolean
        notes?: string
        [key: string]: any
    }
}

interface ManualsSectionProps {
    manuals: Manual[]
    isGenerating?: boolean
    onDelete?: (id: string) => void
    onSave?: (id: string, updates: { manual_content: string, notes: string }) => Promise<void>
    onRegenerate?: (manual: Manual) => Promise<void>
    onAdd?: () => void
    onEdit?: (manual: Manual) => void
    onAddNotes?: (manual: Manual) => void
}

export function ManualsSection({
    manuals,
    isGenerating = false,
    onDelete,
    onSave,
    onRegenerate,
}: ManualsSectionProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)

    // Form state for expanded manual
    const [editContent, setEditContent] = useState('')
    const [editNotes, setEditNotes] = useState('')

    const stats = {
        total: manuals.length,
        edited: manuals.filter(m => m.metadata?.status === 'edited' || new Date(m.updated_at).getTime() > new Date(m.created_at).getTime() + 1000).length,
        pending: manuals.filter(m => !m.metadata?.is_revised && m.metadata?.status !== 'reviewed').length
    }

    const handleExpand = (manual: Manual) => {
        if (expandedId === manual.id) {
            setExpandedId(null)
            return
        }
        setExpandedId(manual.id)
        setEditContent(manual.manual_content || '')
        setEditNotes(manual.metadata?.notes || '')
    }

    const handleSaveAndApprove = async (id: string) => {
        if (!onSave) return
        setIsSaving(true)
        try {
            await onSave(id, {
                manual_content: editContent,
                notes: editNotes
            })
            setExpandedId(null)
        } catch (error) {
            console.error('Error saving manual:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRegenerate = async (manual: Manual) => {
        if (!onRegenerate) return
        setIsRegenerating(true)
        try {
            await onRegenerate(manual)
            // OnSuccess of regeneration, we might want to update editContent
            // But usually regeneration happens via AI filling the field
        } catch (error) {
            console.error('Error regenerating:', error)
        } finally {
            setIsRegenerating(false)
        }
    }

    const getIcon = (name: string) => {
        const n = (name || '').toLowerCase()
        if (n.includes('lavadora') || n.includes('lavavajillas')) return <Droplets className="h-6 w-6" />
        if (n.includes('horno') || n.includes('microondas') || n.includes('cocina')) return <ChefHat className="h-6 w-6" />
        if (n.includes('aire') || n.includes('clima')) return <Wind className="h-6 w-6" />
        if (n.includes('tv') || n.includes('tele')) return <Laptop className="h-6 w-6" />
        if (n.includes('luz') || n.includes('lampara')) return <Lightbulb className="h-6 w-6" />
        return <Cpu className="h-6 w-6" />
    }

    const getStatusBadge = (manual: Manual) => {
        const isEdited = manual.metadata?.status === 'edited' || new Date(manual.updated_at).getTime() > new Date(manual.created_at).getTime() + 1000
        const isRevised = manual.metadata?.is_revised || manual.metadata?.status === 'reviewed'
        const isIA = manual.metadata?.source === 'image' || manual.metadata?.source === 'inventory_selector' || !isEdited

        if (isEdited) return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight"><Edit2 className="w-3 h-3" /> Editado</Badge>
        if (isRevised) return <Badge variant="outline" className="bg-[#316263]/10 text-[#316263] border-[#316263]/20 flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight"><CheckCircle2 className="w-3 h-3" /> Revisado</Badge>
        if (isIA) return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight"><Sparkles className="w-3 h-3" /> IA</Badge>

        return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight">Pendiente</Badge>
    }

    return (
        <div className="space-y-8">
            {/* Banner generando */}
            {isGenerating && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in duration-300">
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-900">Generando manuales técnicos...</p>
                        <p className="text-xs text-amber-700">La IA está redactando cada manual en segundo plano. Aparecerán automáticamente al completarse.</p>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col items-center justify-center text-center py-2 border-r border-slate-50">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xl font-black text-slate-900">{stats.total}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">manuales</span>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center text-center py-2 border-r border-slate-50">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xl font-black text-slate-900">{stats.edited}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">editados</span>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center text-center py-2">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xl font-black text-[#316263]">{stats.pending}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">pendientes</span>
                    </div>
                </div>
            </div>

            {/* Grid of Manuals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Skeletons cuando se está generando y no hay manuales todavía */}
                {isGenerating && manuals.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse">
                        <div className="flex items-start gap-6">
                            <div className="h-14 w-14 rounded-xl bg-slate-100 shrink-0" />
                            <div className="flex-1 space-y-3 pt-1">
                                <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                                <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                            </div>
                        </div>
                        <div className="space-y-2 mt-6">
                            <div className="h-3 bg-slate-100 rounded-full w-full" />
                            <div className="h-3 bg-slate-100 rounded-full w-5/6" />
                        </div>
                    </div>
                ))}

                {manuals.map((manual, index) => {
                    const isExpanded = expandedId === manual.id
                    return (
                        <motion.div
                            key={manual.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group relative flex flex-col",
                                isExpanded ? "md:col-span-2 ring-2 ring-[#316263] border-transparent shadow-lg" : "h-full shadow-sm"
                            )}
                        >
                            <div className="p-6 text-left">
                                <div className="flex items-start gap-6">
                                    <div className={cn(
                                        "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500",
                                        isExpanded ? "bg-[#316263] text-white" : "bg-slate-50 text-slate-400 group-hover:bg-[#316263]/10 group-hover:text-[#316263]"
                                    )}>
                                        {getIcon(manual.appliance_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-bold text-slate-900 truncate">
                                                {manual.appliance_name} {manual.brand ? ` ${manual.brand}` : ''}
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleExpand(manual)}
                                                className="h-10 w-10 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-slate-50"
                                            >
                                                {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(manual)}
                                            {!manual.metadata?.is_revised && manual.metadata?.status !== 'reviewed' && (
                                                <Badge variant="outline" className="bg-rose-50 text-rose-500 border-rose-100 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight">Pendiente</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {!isExpanded ? (
                                        <motion.div
                                            key="collapsed"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2 my-6">
                                                {manual.manual_content?.replace(/[#*`]/g, '').slice(0, 120)}...
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="expanded"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-8 pt-8 border-t border-slate-100 space-y-8"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">instrucciones (generadas por ia)</h5>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRegenerate(manual)}
                                                        className="text-[#316263] hover:text-[#316263] hover:bg-[#316263]/5 font-bold h-8 text-[11px]"
                                                        disabled={isRegenerating}
                                                    >
                                                        {isRegenerating ? <RefreshCcw className="w-3 h-3 mr-2 animate-spin" /> : null}
                                                        Regenerar texto
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    className="min-h-[200px] rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 p-5 text-xs font-medium leading-relaxed"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">notas del propietario</h5>
                                                <Textarea
                                                    value={editNotes}
                                                    onChange={e => setEditNotes(e.target.value)}
                                                    placeholder="Añade detalles específicos de este aparato en tu casa..."
                                                    className="min-h-[100px] rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 p-5 text-xs font-medium leading-relaxed"
                                                />
                                                <p className="text-[10px] text-slate-400 font-medium">Tus notas aparecerán destacadas en la guía del huésped.</p>
                                            </div>

                                            <div className="flex items-center justify-end gap-4 pt-4">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setExpandedId(null)}
                                                    className="text-slate-400 hover:text-slate-900 font-bold"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={() => handleSaveAndApprove(manual.id)}
                                                    disabled={isSaving}
                                                    className="bg-[#316263] hover:bg-[#316263]/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-teal-900/20"
                                                >
                                                    {isSaving ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                    Guardar y Aprobar
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!isExpanded && (
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <Button
                                            onClick={() => handleExpand(manual)}
                                            variant="ghost"
                                            className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2 px-0 hover:bg-transparent"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Editar manual
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete?.(manual.id)}
                                            className="h-10 w-10 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
