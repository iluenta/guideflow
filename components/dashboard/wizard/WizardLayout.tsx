'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs } from '@/components/ui/tabs'
import { WizardStepper } from './WizardStepper'
import { WizardNavigation } from './WizardNavigation'
import { useWizard } from './WizardContext'

export function WizardLayout({ children }: { children: React.ReactNode }) {
    const {
        activeTab,
        handleTabChange,
        completedSteps,
        propertyId,
        direction,
        mounted
    } = useWizard()

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col pt-12">
            {/* Header */}
            <header className="bg-transparent pt-8 pb-4 text-center px-4">
                <h1 className="text-3xl md:text-5xl font-bold text-navy mb-3 font-serif italic tracking-tighter">
                    Configura tu Guía Mágica
                </h1>
                <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto font-medium">
                    Rellena la información para que tu asistente IA pueda ayudar a tus huéspedes.
                </p>
            </header>

            {/* Stepper */}
            <WizardStepper />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-48 md:pb-12 mt-4">
                {/* Render tabs only after client hydration to prevent Radix UI ID mismatch */}
                {mounted ? (
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={activeTab}
                            custom={direction}
                            initial={{ x: direction * 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction * -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                {React.Children.map(children, (child) => {
                                    if (!React.isValidElement(child)) return child
                                    const childProps = child.props as any
                                    if (childProps.value === activeTab) {
                                        return child
                                    }
                                    return null
                                })}
                            </Tabs>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="w-full h-96 bg-white rounded-3xl animate-pulse shadow-sm" />
                )}
            </main>

            {/* Floating Navigation for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:hidden z-50">
                <WizardNavigation />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block max-w-4xl mx-auto w-full px-4 mb-20">
                <WizardNavigation />
            </div>
        </div>
    )
}
