'use client';

import React from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './WizardContext';

export function WizardNavigation() {
    const {
        activeTab,
        handleNext,
        handleBack,
        handleTabChange,
        loading,
        aiLoading,
        property,
        filteredSteps,
        isEditing,
        saveStep,
        data
    } = useWizard()

    const currentIndex = filteredSteps.indexOf(activeTab)
    const isFirstStep = currentIndex === 0
    const isLastStep = currentIndex === filteredSteps.length - 1
    const canContinue = property?.id || isFirstStep
    const isDisabled = loading || !!aiLoading || !canContinue

    const mainLabel = isEditing ? 'Guardar Sección' : (isLastStep ? 'Finalizar configuración' : 'Guardar y continuar')
    const mainIcon = (isLastStep && !isEditing)
        ? <CheckCircle className="w-5 h-5 shrink-0" />
        : <ArrowRight className="w-5 h-5 shrink-0" />

    const mainBtnClass = cn(
        "flex items-center justify-center gap-3 font-bold text-white transition-all duration-200 active:scale-[0.98] px-6",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        isLastStep && !isEditing
            ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-200"
            : "bg-[#111827] hover:bg-[#1f2937] hover:shadow-xl hover:shadow-slate-300/50"
    )

    const handleOnlyNext = () => {
        const nextIdx = currentIndex + 1
        if (nextIdx < filteredSteps.length) {
            handleTabChange(filteredSteps[nextIdx])
        }
    }

    const handleSaveOnly = async () => {
        await saveStep(activeTab, data[activeTab], '')
    }

    return (
        <div className="sticky bottom-0 left-0 right-0 z-10 mt-8">
            {/* Fade superior */}
            <div className="h-8 bg-gradient-to-t from-[#f5f4f0] to-transparent pointer-events-none" />

            <div className="bg-[#f5f4f0] px-4 pb-5 pt-1 md:px-6 md:pb-6">

                {/* ── MÓVIL ──────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 md:hidden">
                    {/* Contador de paso */}
                    <div className="flex items-center justify-between px-1">
                        {!isFirstStep ? (
                            <button
                                onClick={handleBack}
                                disabled={!!loading}
                                className="group flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors font-semibold text-sm disabled:opacity-40"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                                    <ArrowLeft className="w-4 h-4" />
                                </span>
                                Atrás
                            </button>
                        ) : <div />}
                        <span className="text-xs font-semibold text-slate-400">
                            Paso {currentIndex + 1} de {filteredSteps.length}
                        </span>
                    </div>

                    {/* Barra de progreso fina */}
                    <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#316263] transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / filteredSteps.length) * 100}%` }}
                        />
                    </div>

                    {/* Botones Móvil */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={isEditing ? handleSaveOnly : handleNext}
                            disabled={isDisabled}
                            className={cn(mainBtnClass, "w-full rounded-2xl py-4 text-base shadow-lg")}
                        >
                            {loading || aiLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{aiLoading ? 'Procesando IA...' : 'Guardando...'}</span>
                                </>
                            ) : (
                                <>{mainLabel}{mainIcon}</>
                            )}
                        </button>
                        {isEditing && !isLastStep && (
                            <button
                                onClick={handleOnlyNext}
                                disabled={!!loading}
                                className="w-full flex items-center justify-center gap-2 font-bold text-slate-600 border border-slate-200 bg-white rounded-2xl py-4 text-base shadow-sm"
                            >
                                Siguiente paso
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── ESCRITORIO ─────────────────────────────────────────────── */}
                <div className="hidden md:flex items-center justify-between gap-4 max-w-4xl mx-auto">

                    {/* Atrás */}
                    <div className="w-28">
                        {!isFirstStep && (
                            <button
                                onClick={handleBack}
                                disabled={!!loading}
                                className="group flex items-center gap-2.5 text-slate-400 hover:text-slate-700 transition-colors font-semibold text-sm disabled:opacity-40"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm group-hover:border-slate-300 group-hover:shadow-md transition-all">
                                    <ArrowLeft className="w-4 h-4" />
                                </span>
                                Atrás
                            </button>
                        )}
                    </div>

                    {/* Puntos de progreso */}
                    <div className="flex items-center gap-1.5">
                        {filteredSteps.map((step, idx) => (
                            <div
                                key={step}
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    idx === currentIndex
                                        ? "w-6 h-2 bg-[#316263]"
                                        : idx < currentIndex
                                            ? "w-2 h-2 bg-[#316263]/40"
                                            : "w-2 h-2 bg-slate-200"
                                )}
                            />
                        ))}
                    </div>

                    {/* Botones Escritorio */}
                    <div className="flex items-center gap-3">
                        {isEditing && !isLastStep && (
                            <button
                                onClick={handleOnlyNext}
                                disabled={!!loading}
                                className="flex items-center justify-center gap-2 font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-2xl px-6 py-4 text-[15px] shadow-sm transition-all"
                            >
                                Siguiente
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={isEditing ? handleSaveOnly : handleNext}
                            disabled={isDisabled}
                            className={cn(mainBtnClass, "rounded-2xl py-4 text-[15px] shadow-lg min-w-[180px]")}
                        >
                            {loading || aiLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{aiLoading ? 'Procesando IA...' : 'Guardando...'}</span>
                                </>
                            ) : (
                                <>{mainLabel}{mainIcon}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}