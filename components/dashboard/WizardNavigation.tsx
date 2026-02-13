'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardNavigationProps {
    onNext: () => void;
    onBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    loading?: boolean;
    canContinue?: boolean;
}

export function WizardNavigation({
    onNext,
    onBack,
    isFirstStep,
    isLastStep,
    loading = false,
    canContinue = true
}: WizardNavigationProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 md:sticky md:bottom-0 md:bg-white md:border-slate-100 md:rounded-b-2xl md:mt-8 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                <div className="w-1/3">
                    {!isFirstStep && (
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            disabled={loading}
                            className="text-slate-500 hover:text-navy hover:bg-slate-50 font-bold text-xs px-0"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Anterior
                        </Button>
                    )}
                </div>

                <div className="w-2/3 flex justify-end">
                    <Button
                        onClick={onNext}
                        disabled={loading || !canContinue}
                        className={cn(
                            "w-full md:w-auto min-w-[200px] font-bold text-xs uppercase tracking-wider h-11 rounded-xl shadow-lg transition-all duration-300",
                            isLastStep
                                ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                                : "bg-primary hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Guardando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                {isLastStep ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {isLastStep ? 'Finalizar Guía' : 'Guardar y Continuar'}
                                {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
