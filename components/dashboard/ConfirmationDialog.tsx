'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'info' | 'warning'
  loading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmationDialogProps) {
  
  const variantStyles = {
    danger: {
      icon: <Trash2 className="h-6 w-6 text-rose-500" />,
      bg: "bg-rose-50",
      button: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50",
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      bg: "bg-amber-50",
      button: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50",
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-500" />,
      bg: "bg-blue-50",
      button: "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-blue-200/50",
    }
  }

  const style = variantStyles[variant]

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[400px] rounded-[32px] p-8 border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] bg-white/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
        <AlertDialogHeader className="space-y-5">
          <div className={cn("mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", style.bg)}>
            {style.icon}
          </div>
          <div className="space-y-2.5 text-center">
            <AlertDialogTitle className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-slate-500 text-[14px] leading-[1.6] whitespace-pre-line font-medium px-2">
                {description}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-8 flex flex-row gap-3 sm:justify-center w-full">
          <AlertDialogCancel 
            onClick={onClose}
            className="flex-1 mt-0 h-12 rounded-2xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className={cn(
              "flex-1 h-12 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50",
              style.button
            )}
          >
            {loading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
