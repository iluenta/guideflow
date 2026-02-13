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
        <div className="fixed bottom-24 left-0 right-0 md:sticky md:bottom-0 bg-transparent md:bg-white md:border-t md:border-slate-100 md:rounded-b-2xl md:mt-8 z-40 px-6 md:p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                <div className="flex-1 shrink-0">
                    {!isFirstStep && (
                        <Button
                            variant="outline"
                            onClick={onBack}
                            disabled={loading}
                            className="w-11 h-11 md:w-auto md:h-auto md:px-0 md:py-0 md:border-none md:bg-transparent rounded-full md:rounded-none bg-white text-slate-500 hover:text-navy shadow-lg md:shadow-none border-slate-200"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline font-bold text-xs">Anterior</span>
                        </Button>
                    )}
                </div>

                <div className="flex-1 flex justify-end">
                    <Button
                        onClick={onNext}
                        disabled={loading || !canContinue}
                        className={cn(
                            "rounded-full md:rounded-xl shadow-xl transition-all duration-300 w-14 h-14 md:w-auto md:min-w-[200px] md:h-11",
                            isLastStep
                                ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                                : "bg-primary hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span className="hidden md:inline">Guardando...</span>
                            </span>
                        ) : (
                            <>
                                {isLastStep ? <CheckCircle className="w-6 h-6 md:w-4 md:h-4 md:mr-1" /> : <Save className="w-6 h-6 md:w-4 md:h-4 md:mr-1" />}
                                <span className="hidden md:inline ml-1 font-bold text-xs uppercase tracking-wider">
                                    {isLastStep ? 'Finalizar Guía' : 'Guardar y Continuar'}
                                </span>
                                {!isLastStep && <ArrowRight className="hidden md:inline w-4 h-4 ml-1" />}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
