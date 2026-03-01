'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionViewProps {
    title: string
    description: string
    isEditMode: boolean
    onToggleEdit?: () => void
    children: React.ReactNode
}

export function SectionView({
    title,
    description,
    isEditMode,
    onToggleEdit,
    children,
}: SectionViewProps) {
    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
                    <p className="text-slate-500 mt-1 text-xs font-medium max-w-2xl">{description}</p>
                </div>
                {onToggleEdit && (
                    <Button
                        onClick={onToggleEdit}
                        variant="outline"
                        className="h-11 px-6 rounded-xl border-slate-200 text-slate-900 font-bold hover:bg-white hover:shadow-md transition-all flex items-center gap-3 text-sm shrink-0 self-start md:self-center"
                    >
                        {isEditMode ? (
                            <>
                                <Eye className="h-6 w-6 text-[#316263]" />
                                Ver Vista Previa
                            </>
                        ) : (
                            <>
                                <Edit2 className="h-6 w-6 text-[#316263]" />
                                Editar Sección
                            </>
                        )}
                    </Button>
                )}
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="pt-4"
            >
                {children}
            </motion.div>
        </div>
    )
}
