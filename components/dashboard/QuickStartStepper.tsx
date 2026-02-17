'use client'

import { motion } from 'framer-motion'
import { Check, Home, MapPin, Wifi, Key } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickStartStepperProps {
    currentStep: number
    steps: Array<{ id: string; label: string; icon: any }>
}

export function QuickStartStepper({ currentStep, steps }: QuickStartStepperProps) {
    return (
        <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -z-10 -translate-y-1/2 hidden md:block" />
            
            {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                
                return (
                    <div key={step.id} className="flex flex-col items-center bg-white md:px-2 z-10">
                        <div
                            className={cn(
                                "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                isCompleted ? "bg-primary border-primary text-white" : "",
                                isCurrent ? "border-primary text-primary ring-8 ring-primary/5 scale-110 shadow-lg shadow-primary/10" : "",
                                !isCompleted && !isCurrent ? "border-gray-100 text-gray-300 bg-white" : ""
                            )}
                        >
                            {isCompleted ? (
                                <Check className="w-5 h-5 md:w-6 md:h-6" />
                            ) : (
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                        </div>
                        <div className="text-center mt-3 hidden md:block">
                            <p
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider transition-colors",
                                    isCurrent ? "text-primary" : "text-gray-400"
                                )}
                            >
                                {step.label}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
