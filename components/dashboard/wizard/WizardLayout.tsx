'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs } from '@/components/ui/tabs'
import { WizardProgressHeader } from './WizardProgressHeader'
import { WizardSidebar } from './WizardSidebar'
import { WizardNavigation } from './WizardNavigation'
import { SectionView } from './SectionView'
import { useWizard } from './WizardContext'
import {
    Home,
    Palette,
    MapPin,
    MessageSquare,
    Phone,
    Key,
    ShieldCheck,
    Wifi,
    Camera,
    FileText,
    ListChecks,
    Utensils,
    HelpCircle,
    ChevronLeft,
    Menu,
    Eye
} from 'lucide-react'

export function WizardLayout({ children }: { children: React.ReactNode }) {
    const {
        activeTab,
        handleTabChange,
        completedSteps,
        property,
        loading,
        aiLoading,
        direction,
        mounted,
        filteredSteps,
        isEditing,
        resolvedPropertyId
    } = useWizard()

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

    // Map internal step names to user-friendly titles and icons
    const stepMetadata: Record<string, { title: string; description: string; icon: any }> = {
        'property': {
            title: 'Información General',
            description: 'Define los detalles básicos de tu propiedad para personalizar la guía.',
            icon: Home
        },
        'appearance': {
            title: 'Estética y Diseño',
            description: 'Personaliza colores y logotipos para que la guía refleje tu marca.',
            icon: Palette
        },
        'access': {
            title: 'Ubicación y Transporte',
            description: 'Ayuda a tus huéspedes a llegar sin problemas con mapas e instrucciones de transporte.',
            icon: MapPin
        },
        'welcome': {
            title: 'Mensaje de Bienvenida',
            description: 'Escribe un saludo cálido y personal para tus huéspedes.',
            icon: MessageSquare
        },
        'contacts': {
            title: 'Números de Contacto',
            description: 'Asegúrate de que tus huéspedes sepan a quién llamar en cada situación.',
            icon: Phone
        },
        'checkin': {
            title: 'Instrucciones de Llegada',
            description: 'Explica paso a paso cómo entrar a la propiedad y dónde encontrar las llaves.',
            icon: Key
        },
        'rules': {
            title: 'Normas de la Casa',
            description: 'Establece expectativas claras para una convivencia armoniosa.',
            icon: ShieldCheck
        },
        'tech': {
            title: 'Tecnología y Conectividad',
            description: 'Información vital sobre el WiFi y otros dispositivos tecnológicos.',
            icon: Wifi
        },
        'visual-scanner': {
            title: 'Escáner Visual IA',
            description: 'Sube fotos de tus aparatos para que la IA genere manuales automáticamente.',
            icon: Camera
        },
        'appliance-manuals': {
            title: 'Manuales de Aparatos',
            description: 'Genera manuales detallados para tus electrodomésticos.',
            icon: FileText
        },
        'inventory': {
            title: 'Inventario de Aparatos',
            description: 'Selecciona qué electrodomésticos tienes para generar sus guías técnicas.',
            icon: ListChecks
        },
        'dining': {
            title: 'Recomendaciones Locales',
            description: 'Comparte tus rincones favoritos para comer, comprar o visitar.',
            icon: Utensils
        },
        'faqs': {
            title: 'Dudas Frecuentes',
            description: 'Anticípate a las preguntas más comunes de tus huéspedes.',
            icon: HelpCircle
        },
    }

    const sidebarItems = filteredSteps.map(stepId => ({
        id: stepId,
        title: stepMetadata[stepId]?.title || stepId,
        icon: stepMetadata[stepId]?.icon || HelpCircle,
        status: completedSteps.includes(stepId) ? 'complete' : 'incomplete' as any
    }))

    const progressValue = (completedSteps.length / filteredSteps.length) * 100

    return (
        <div className="min-h-screen bg-[#F5F2ED] flex flex-col font-sans text-slate-900">
            <WizardProgressHeader
                propertyName={property?.name || 'Nueva Propiedad'}
                progress={progressValue}
                onMenuClick={() => setIsSidebarOpen(true)}
                onViewGuide={() => window.open(`/${property?.slug}`, '_blank')}
            />

            <div className="flex-1 flex max-w-[1600px] mx-auto w-full lg:px-6 py-8 gap-8 overflow-hidden">
                <WizardSidebar
                    items={sidebarItems}
                    activeId={activeTab}
                    onItemClick={handleTabChange}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    // Unblock sidebar navigation as soon as the property is created (resolvedPropertyId exists).
                    // Only block if we are in the very first step before saving the property.
                    disabled={loading || (!!aiLoading && !resolvedPropertyId)}
                />
                <main className="flex-1 px-4 lg:px-0 overflow-y-auto custom-scrollbar pb-24">
                    {mounted ? (
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={activeTab}
                                custom={direction}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full max-w-4xl"
                            >
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                    <SectionView
                                        title={stepMetadata[activeTab]?.title || activeTab}
                                        description={stepMetadata[activeTab]?.description || ''}
                                        isEditMode={true}
                                    >
                                        {React.Children.map(children, (child) => {
                                            if (!React.isValidElement(child)) return child
                                            const childProps = child.props as any
                                            if (childProps.value === activeTab) {
                                                return child
                                            }
                                            return null
                                        })}
                                    </SectionView>
                                </Tabs>

                                <WizardNavigation />
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="w-full max-w-4xl h-[600px] bg-white/50 backdrop-blur-sm rounded-[3rem] animate-pulse border border-white/20" />
                    )}
                </main>
            </div>
        </div>
    )
}
