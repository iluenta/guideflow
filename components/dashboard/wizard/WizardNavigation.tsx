'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './WizardContext';

export function WizardNavigation() {
    const {
        activeTab,
        handleNext,
        handleBack,
        loading,
        aiLoading,
        property,
        filteredSteps
    } = useWizard()

    const currentIndex = filteredSteps.indexOf(activeTab)
    const isFirstStep = currentIndex === 0
    const isLastStep = currentIndex === filteredSteps.length - 1

    const isIngesting = !!aiLoading || property?.inventory_status === 'identifying' || property?.inventory_status === 'generating'
    const isActionDisabled = loading || isIngesting
    const canContinue = (property?.id || isFirstStep) && !isIngesting

    return (
        <div className="mt-16 pb-10 flex items-center justify-between gap-6 max-w-4xl">
            <div className="flex-1">
                {!isFirstStep && (
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isActionDisabled}
                        className="h-11 px-6 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all font-bold flex items-center gap-3 text-sm"
                    >
                        <ArrowLeft className="w-6 h-6" />
                        Atrás
                    </Button>
                )}
            </div>

            <div className="flex-[2] flex justify-center">
                <Button
                    onClick={handleNext}
                    disabled={isActionDisabled || !canContinue}
                    className={cn(
                        "h-12 px-10 rounded-xl transition-all duration-500 shadow-md flex items-center gap-3 text-sm font-bold group min-w-[220px]",
                        isLastStep
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20"
                            : "bg-[#111827] hover:bg-[#111827]/90 shadow-slate-900/30"
                    )}
                >
                    {loading || aiLoading ? (
                        <div className="flex items-center gap-4">
                            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>{aiLoading ? 'Procesando IA...' : 'Guardando...'}</span>
                        </div>
                    ) : (
                        <>
                            <span>{isLastStep ? 'Finalizar Configuración' : 'Guardar y Continuar'}</span>
                            {isLastStep ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            )}
                        </>
                    )}
                </Button>
            </div>

            <div className="flex-1" />
        </div>
    );
}
