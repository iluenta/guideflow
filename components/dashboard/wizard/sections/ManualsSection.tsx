'use client'

import React, { useState } from 'react'
import {
    FileText, Sparkles, Trash2, Edit2, CheckCircle2,
    Droplets, ChefHat, Wind, Laptop, Lightbulb, Cpu,
    ChevronDown, ChevronUp, RefreshCcw, Save, X, Loader2,
    BookOpen, Clock, LayoutGrid, List
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
    onRegenerate?: (manual: Manual) => Promise<string | void>
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
            const newContent = await onRegenerate(manual)
            if (typeof newContent === 'string') {
                setEditContent(newContent)
            }
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

            {/* Header with Stats and View Mode */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="grid grid-cols-3 gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex-1">
                    <div className="flex items-center gap-3 px-2 border-r border-slate-100">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 leading-none block">{stats.total}</span>
                            <span className="text-xs font-medium text-slate-400 mt-0.5 block">Manuales</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-2 border-r border-slate-100">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Edit2 className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 leading-none block">{stats.edited}</span>
                            <span className="text-xs font-medium text-slate-400 mt-0.5 block">Editados</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-[#316263]" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-[#316263] leading-none block">{stats.pending}</span>
                            <span className="text-xs font-medium text-slate-400 mt-0.5 block">Pendientes</span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm h-12 self-end">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center gap-2 px-4 rounded-lg transition-all font-bold text-xs",
                            viewMode === 'grid' ? "bg-[#316263] text-white shadow-md shadow-teal-900/10" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Cuadrícula
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "flex items-center gap-2 px-4 rounded-lg transition-all font-bold text-xs",
                            viewMode === 'list' ? "bg-[#316263] text-white shadow-md shadow-teal-900/10" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <List className="w-4 h-4" />
                        Lista
                    </button>
                </div>
            </div>

            {/* Grid/List of Manuals */}
            <div className={cn(
                "transition-all duration-500",
                viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6 items-start" : "flex flex-col gap-3"
            )}>
                {/* Skeletons */}
                {isGenerating && manuals.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                    <div 
                        key={`skeleton-${i}`} 
                        className={cn(
                            "bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse",
                            viewMode === 'list' ? "h-20 flex items-center gap-4 py-0" : ""
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl bg-slate-100 shrink-0" />
                            <div className="flex-1 space-y-3 pt-1">
                                <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                                <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}

                <AnimatePresence mode="popLayout" initial={false}>
                    {manuals.map((manual) => {
                        const isExpanded = expandedId === manual.id
                        
                        // COMMON ACTIONS RENDERER
                        const expandedContent = (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="mt-8 pt-8 border-t border-slate-100 space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-semibold text-slate-700">Instrucciones <span className="text-xs font-normal text-slate-400">(generadas por IA)</span></h5>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleRegenerate(manual); }}
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
                                        onClick={e => e.stopPropagation()}
                                        className="min-h-[200px] rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 p-5 text-xs font-medium leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-sm font-semibold text-slate-700">Notas del propietario</h5>
                                    <Textarea
                                        value={editNotes}
                                        onChange={e => setEditNotes(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        placeholder="Añade detalles específicos de este aparato en tu casa..."
                                        className="min-h-[100px] rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 p-5 text-xs font-medium leading-relaxed"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                                        className="text-slate-400 hover:text-slate-900 font-bold"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); handleSaveAndApprove(manual.id); }}
                                        disabled={isSaving}
                                        className="bg-[#316263] hover:bg-[#316263]/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-teal-900/20"
                                    >
                                        {isSaving ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Guardar y Aprobar
                                    </Button>
                                </div>
                            </motion.div>
                        )

                        if (viewMode === 'list') {
                            return (
                                <motion.div
                                    key={manual.id}
                                    layout="position"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                        "bg-white border rounded-2xl transition-all shadow-sm overflow-hidden",
                                        isExpanded ? "border-[#316263] ring-1 ring-[#316263]/10" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <div 
                                        className="p-4 md:px-6 cursor-pointer flex flex-col"
                                        onClick={() => handleExpand(manual)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                isExpanded ? "bg-[#316263] text-white" : "bg-slate-50 text-slate-400"
                                            )}>
                                                {getIcon(manual.appliance_name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                                    {manual.appliance_name} {manual.brand ? ` ${manual.brand}` : ''}
                                                </h4>
                                            </div>
                                            <div className="hidden sm:block">
                                                {getStatusBadge(manual)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); onDelete?.(manual.id); }}
                                                    className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <div className="text-slate-300">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {isExpanded && expandedContent}
                                    </div>
                                </motion.div>
                            )
                        }

                        // GRID VIEW (Enhanced stability)
                        return (
                            <motion.div
                                key={manual.id}
                                layout="position"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group relative flex flex-col shadow-sm",
                                    isExpanded ? "md:col-span-2 ring-2 ring-[#316263] border-transparent shadow-lg" : "h-full"
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
                                            </div>
                                        </div>
                                    </div>

                                    {!isExpanded ? (
                                        <>
                                            <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2 my-6">
                                                {manual.manual_content?.replace(/[#*`]/g, '').slice(0, 120)}...
                                            </p>
                                            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                                                <Button
                                                    onClick={() => handleExpand(manual)}
                                                    variant="outline"
                                                    className="h-9 px-4 rounded-xl border-[#316263]/20 text-[#316263] hover:bg-[#316263]/5 hover:border-[#316263]/40 font-semibold text-xs gap-2"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                    Editar manual
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDelete?.(manual.id)}
                                                    className="h-9 w-9 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all font-bold"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        expandedContent
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
