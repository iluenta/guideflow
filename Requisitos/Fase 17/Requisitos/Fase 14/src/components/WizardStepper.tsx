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
  BookOpen } from
'lucide-react';
export type Step = {
  id: string;
  label: string;
  icon: React.ElementType;
};
export const STEPS: Step[] = [
{
  id: 'propiedad',
  label: 'Propiedad',
  icon: Home
},
{
  id: 'apariencia',
  label: 'Apariencia',
  icon: Palette
},
{
  id: 'acceso',
  label: 'Acceso',
  icon: Key
},
{
  id: 'saludo',
  label: 'Saludo',
  icon: Sparkles
},
{
  id: 'contactos',
  label: 'Contactos',
  icon: Users
},
{
  id: 'checkin',
  label: 'Check-in',
  icon: Clock
},
{
  id: 'normas',
  label: 'Normas',
  icon: Shield
},
{
  id: 'tech',
  label: 'Tech',
  icon: Wifi
},
{
  id: 'escaner',
  label: 'Escáner',
  icon: QrCode
},
{
  id: 'inventario',
  label: 'Inventario',
  icon: Package
},
{
  id: 'recomendaciones',
  label: 'Recomendaciones',
  icon: MapPin
},
{
  id: 'guia',
  label: 'Guía',
  icon: BookOpen
}];

interface WizardStepperProps {
  currentStepIndex: number;
  onStepClick: (index: number) => void;
}
export function WizardStepper({
  currentStepIndex,
  onStepClick
}: WizardStepperProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const progress = (currentStepIndex + 1) / STEPS.length * 100;
  const currentStep = STEPS[currentStepIndex];
  return (
    <div className="w-full bg-background pb-8 pt-4 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Bar (Global) */}
        <div className="flex items-center justify-between text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          <span>Progreso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-primary"
            initial={{
              width: 0
            }}
            animate={{
              width: `${progress}%`
            }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut'
            }} />

        </div>

        {/* Desktop Stepper (md+) */}
        <div className="hidden md:flex items-start justify-between relative">
          {/* Connecting Line Background */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

          {/* Connecting Line Active */}
          <div
            className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
            style={{
              width: `${currentStepIndex / (STEPS.length - 1) * 100}%`
            }} />


          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => index <= currentStepIndex && onStepClick(index)}
                disabled={index > currentStepIndex}
                className={`group flex flex-col items-center focus:outline-none ${index > currentStepIndex ? 'cursor-not-allowed' : 'cursor-pointer'}`}>

                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 bg-background
                    ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                    ${isCurrent ? 'border-primary text-primary scale-110 ring-4 ring-primary/10' : ''}
                    ${!isCompleted && !isCurrent ? 'border-gray-300 text-gray-400' : ''}
                  `}>

                  {isCompleted ?
                  <Check className="w-4 h-4" /> :

                  <Icon className="w-4 h-4" />
                  }
                </div>
                <span
                  className={`
                    mt-2 text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 max-w-[60px] text-center truncate
                    ${isCurrent ? 'text-primary' : 'text-gray-400'}
                    ${isCompleted ? 'text-primary' : ''}
                  `}
                  title={step.label}>

                  {step.label}
                </span>
              </button>);

          })}
        </div>

        {/* Mobile Stepper (< md) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                {createElement(currentStep.icon, {
                  className: 'w-5 h-5'
                })}
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Paso {currentStepIndex + 1} de {STEPS.length}
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {currentStep.label}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />

          </button>

          <AnimatePresence>
            {isMobileMenuOpen &&
            <motion.div
              initial={{
                opacity: 0,
                y: -10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              className="absolute left-4 right-4 top-[140px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[60vh] overflow-y-auto">

                <div className="p-2">
                  {STEPS.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (index <= currentStepIndex) {
                          onStepClick(index);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      disabled={index > currentStepIndex}
                      className={`
                          w-full flex items-center gap-3 p-3 rounded-lg transition-colors
                          ${isCurrent ? 'bg-primary/5' : 'hover:bg-gray-50'}
                          ${index > currentStepIndex ? 'opacity-50 cursor-not-allowed' : ''}
                        `}>

                        <div
                        className={`
                            flex items-center justify-center w-8 h-8 rounded-full border text-xs font-medium
                            ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                            ${isCurrent ? 'border-primary text-primary' : ''}
                            ${!isCompleted && !isCurrent ? 'border-gray-200 text-gray-400' : ''}
                          `}>

                          {isCompleted ?
                        <Check className="w-4 h-4" /> :

                        index + 1
                        }
                        </div>
                        <span
                        className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-gray-600'}`}>

                          {step.label}
                        </span>
                        {isCurrent &&
                      <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            Actual
                          </span>
                      }
                      </button>);

                })}
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>
    </div>);

}