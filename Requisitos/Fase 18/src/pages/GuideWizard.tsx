import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardStep } from '../components/WizardStep';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Info,
  Menu,
  X,
  CheckCircle2 } from
'lucide-react';
export function GuideWizard() {
  const [currentStep, setCurrentStep] = useState(3);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const steps = [
  {
    id: 1,
    title: 'Propiedad'
  },
  {
    id: 2,
    title: 'Apariencia'
  },
  {
    id: 3,
    title: 'Acceso'
  },
  {
    id: 4,
    title: 'Saludo'
  },
  {
    id: 5,
    title: 'Contactos'
  },
  {
    id: 6,
    title: 'Check-in'
  },
  {
    id: 7,
    title: 'Normas'
  },
  {
    id: 8,
    title: 'Tech'
  },
  {
    id: 9,
    title: 'Escáner'
  },
  {
    id: 10,
    title: 'Inventario'
  },
  {
    id: 11,
    title: 'Recomendaciones'
  },
  {
    id: 12,
    title: 'Guía'
  }];

  const getStepStatus = (stepId: number) => {
    if (stepId === currentStep) return 'active';
    if (stepId < currentStep) return 'complete';
    return 'upcoming';
  };
  const completedCount = currentStep - 1;
  const progressPct = Math.round(completedCount / 12 * 100);
  const currentStepTitle = steps.find((s) => s.id === currentStep)?.title ?? '';
  const nextStepTitle = steps.find((s) => s.id === currentStep + 1)?.title ?? '';
  const handleStepClick = (id: number) => {
    setCurrentStep(id);
    setMobileNavOpen(false);
  };
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8F7F4]">
      {/* ── DESKTOP HEADER ── */}
      <div className="hidden md:flex h-14 bg-white border-b border-gray-200 items-center justify-between px-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Propiedad
            </span>
            <h1 className="text-sm font-bold text-navy">Villa Sol</h1>
          </div>
        </div>

        <span className="text-xs font-medium text-gray-400">
          Configuración de Guía
        </span>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-600 block">
                Paso {currentStep} de 12
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {progressPct}% Completado
              </span>
            </div>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                animate={{
                  width: `${progressPct}%`
                }}
                transition={{
                  duration: 0.4
                }} />

            </div>
          </div>
          <button className="text-sm font-medium text-gray-500 hover:text-navy transition-colors">
            Guardar borrador
          </button>
        </div>
      </div>

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden bg-white border-b border-gray-200 flex-shrink-0 z-30">
        {/* Row 1: back + title + menu */}
        <div className="flex items-center justify-between px-4 h-14">
          <button className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-bold text-navy leading-tight">
              Villa Sol
            </h1>
            <span className="text-[11px] text-gray-400">
              Paso {currentStep}/12 — {currentStepTitle}
            </span>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">

            {mobileNavOpen ?
            <X className="w-5 h-5" /> :

            <Menu className="w-5 h-5" />
            }
          </button>
        </div>
        {/* Row 2: progress bar */}
        <div className="h-1 bg-gray-100 mx-4 mb-3 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            animate={{
              width: `${progressPct}%`
            }}
            transition={{
              duration: 0.4
            }} />

        </div>
      </div>

      {/* ── MOBILE STEP DRAWER ── */}
      <AnimatePresence>
        {mobileNavOpen &&
        <motion.div
          initial={{
            height: 0,
            opacity: 0
          }}
          animate={{
            height: 'auto',
            opacity: 1
          }}
          exit={{
            height: 0,
            opacity: 0
          }}
          transition={{
            duration: 0.25,
            ease: 'easeInOut'
          }}
          className="md:hidden bg-white border-b border-gray-200 overflow-hidden z-20 flex-shrink-0">

            <div className="px-2 py-2 grid grid-cols-2 gap-0.5 max-h-72 overflow-y-auto">
              {steps.map((step) =>
            <WizardStep
              key={step.id}
              stepNumber={step.id}
              title={step.title}
              status={getStepStatus(step.id)}
              onClick={() => handleStepClick(step.id)} />

            )}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Progreso total
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${progressPct}%`
                  }} />

                </div>
                <span className="text-xs font-bold text-navy">
                  {progressPct}%
                </span>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Step Navigator (desktop only) */}
        <div className="hidden md:flex w-[260px] bg-white border-r border-gray-200 flex-col flex-shrink-0 z-10">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Secciones
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {steps.map((step) =>
            <WizardStep
              key={step.id}
              stepNumber={step.id}
              title={step.title}
              status={getStepStatus(step.id)}
              onClick={() => setCurrentStep(step.id)} />

            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500">
                Progreso Total
              </span>
              <span className="text-xs font-bold text-navy">
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                animate={{
                  width: `${progressPct}%`
                }}
                transition={{
                  duration: 0.4
                }} />

            </div>
          </div>
        </div>

        {/* FORM CONTENT */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto pb-32">
            {/* Step Header */}
            <div className="mb-6 md:mb-8">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 block">
                {String(currentStep).padStart(2, '0')} — {currentStepTitle}
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-navy mb-2">
                Instrucciones de Acceso
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Indica cómo pueden entrar tus huéspedes al alojamiento de forma
                segura.
              </p>
            </div>

            {/* Form Card */}
            <motion.div
              key={currentStep}
              initial={{
                opacity: 0,
                y: 12
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.3
              }}
              className="bg-white rounded-xl shadow-card border border-gray-100 p-5 md:p-8 space-y-6 md:space-y-8">

              {/* Access Type */}
              <div>
                <label className="block text-sm font-bold text-navy mb-2">
                  Tipo de Acceso
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-navy focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer">
                    <option>Caja de seguridad (Keybox)</option>
                    <option>Código de teclado inteligente</option>
                    <option>Llave física (Entrega en persona)</option>
                    <option>App móvil / Bluetooth</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-navy">
                    Código o Instrucciones
                  </label>
                  <button className="text-xs font-medium text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50">
                    <Sparkles className="w-3 h-3" />
                    Mejorar con IA
                  </button>
                </div>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                  placeholder="Ej: La caja de seguridad está junto a la puerta principal. El código es 4821."
                  defaultValue="La caja de seguridad está ubicada en la pared derecha de la entrada principal. El código para abrirla es 4821. Dentro encontrarás dos juegos de llaves." />

                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  Solo visible para huéspedes con reserva confirmada.
                </p>
              </div>

              {/* Times — stacks on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">
                    Hora de Check-in
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      defaultValue="15:00"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-navy focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />

                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">
                    Hora de Check-out
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      defaultValue="11:00"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-navy focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />

                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-navy">
                    Recordatorio Automático
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enviar instrucciones 24h antes de la llegada.
                  </p>
                </div>
                <button className="w-11 h-6 bg-indigo-600 rounded-full relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span className="absolute left-6 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            </motion.div>

            {/* Completion hint */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Los cambios se guardan automáticamente al avanzar al siguiente
              paso.
            </div>
          </div>

          {/* ── BOTTOM NAVIGATION ── */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-10">
            {/* Mobile: stacked layout */}
            <div className="flex flex-col gap-2 p-4 md:hidden">
              <button
                onClick={() => setCurrentStep(Math.min(12, currentStep + 1))}
                className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-lg shadow-indigo-200">

                {nextStepTitle ? `Siguiente: ${nextStepTitle}` : 'Finalizar'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center">

                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Anterior
                </button>
                <button className="flex-1 py-3 text-gray-400 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors text-sm">
                  Guardar y salir
                </button>
              </div>
            </div>

            {/* Desktop: horizontal layout */}
            <div className="hidden md:flex items-center justify-between px-8 py-4">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center">

                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </button>
              <button className="text-sm text-gray-400 hover:text-navy transition-colors">
                Guardar y salir
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(12, currentStep + 1))}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center">

                {nextStepTitle ? `Siguiente: ${nextStepTitle}` : 'Finalizar'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);

}