'use client';

import React, { useState, createElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    ChevronDown,
    Home,
    Palette,
    Key,
    Sparkles,
    Users,
    Clock,
    Shield,
    Wifi,
    QrCode,
    Package,
    MapPin,
    Utensils,
    HelpCircle,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type Step = {
    id: string;
    label: string;
    icon: React.ElementType;
};

export const STEPS: Step[] = [
    { id: 'property', label: 'Propiedad', icon: Home },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'access', label: 'Acceso', icon: Key },
    { id: 'welcome', label: 'Saludo', icon: Sparkles },
    { id: 'contacts', label: 'Contactos', icon: Users },
    { id: 'checkin', label: 'Check-in', icon: Clock },
    { id: 'rules', label: 'Normas', icon: Shield },
    { id: 'tech', label: 'Tech', icon: Wifi },
    { id: 'visual-scanner', label: 'Escáner', icon: QrCode },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'dining', label: 'Recomendaciones', icon: Utensils },
    { id: 'faqs', label: 'Guía', icon: BookOpen },
];

interface WizardStepperProps {
    activeTab: string;
    onStepClick: (stepId: string) => void;
    completedSteps: string[];
}

export function WizardStepper({
    activeTab,
    onStepClick,
    completedSteps
}: WizardStepperProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const currentStepIndex = STEPS.findIndex(s => s.id === activeTab);
    const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
    const currentStep = STEPS[currentStepIndex] || STEPS[0];

    return (
        <div className="w-full bg-background pb-8 pt-4 sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4">
                {/* Progress Bar (Global) */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Progreso de Configuración</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-8">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>

                {/* Desktop Stepper (md+) */}
                <div className="hidden md:flex items-start justify-between relative">
                    {/* Connecting Line Background */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-10" />

                    {/* Connecting Line Active */}
                    <div
                        className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
                        style={{
                            width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                        }}
                    />

                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id) || index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const Icon = step.icon;

                        return (
                            <button
                                key={step.id}
                                onClick={() => onStepClick(step.id)}
                                className="group flex flex-col items-center focus:outline-none transition-all duration-300 cursor-pointer"
                            >
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 bg-white",
                                        isCompleted ? "bg-primary border-primary text-white" : "",
                                        isCurrent && !isCompleted ? "border-primary text-primary scale-110 ring-4 ring-primary/10" : "",
                                        !isCompleted && !isCurrent ? "border-slate-200 text-slate-400" : ""
                                    )}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                </div>
                                <span
                                    className={cn(
                                        "mt-2 text-[9px] font-bold uppercase tracking-tight transition-colors duration-300 max-w-[60px] text-center",
                                        isCurrent ? "text-primary" : "text-slate-400",
                                        isCompleted ? "text-slate-600" : ""
                                    )}
                                >
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Stepper (< md) */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                                {createElement(currentStep.icon, { className: 'w-5 h-5' })}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Paso {currentStepIndex + 1} de {STEPS.length}
                                </p>
                                <p className="text-sm font-bold text-navy">
                                    {currentStep.label}
                                </p>
                            </div>
                        </div>
                        <ChevronDown
                            className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isMobileMenuOpen ? "rotate-180" : "")}
                        />
                    </button>

                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-4 right-4 top-[140px] bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-[60vh] overflow-y-auto"
                            >
                                <div className="p-2">
                                    {STEPS.map((step, index) => {
                                        const isCompleted = completedSteps.includes(step.id) || index < currentStepIndex;
                                        const isCurrent = index === currentStepIndex;
                                        return (
                                            <button
                                                key={step.id}
                                                onClick={() => {
                                                    onStepClick(step.id);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                                                    isCurrent ? "bg-primary/5" : "hover:bg-slate-50"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "flex items-center justify-center w-8 h-8 rounded-full border text-[10px] font-bold",
                                                        isCompleted ? "bg-primary border-primary text-white" : "",
                                                        isCurrent && !isCompleted ? "border-primary text-primary" : "",
                                                        !isCompleted && !isCurrent ? "border-slate-200 text-slate-400" : ""
                                                    )}
                                                >
                                                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                                                </div>
                                                <span className={cn("text-xs font-bold uppercase tracking-wide", isCurrent ? "text-primary" : "text-slate-600")}>
                                                    {step.label}
                                                </span>
                                                {isCurrent && (
                                                    <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                        Actual
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
