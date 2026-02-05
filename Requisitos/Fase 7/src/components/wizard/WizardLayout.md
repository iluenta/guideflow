import React from 'react';
import { Stepper } from './Stepper';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  onStepClick: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  children: React.ReactNode;
  isFirstStep: boolean;
  isLastStep: boolean;
  isValid: boolean;
}
export function WizardLayout({
  currentStep,
  totalSteps,
  completedSteps,
  onStepClick,
  onNext,
  onBack,
  children,
  isFirstStep,
  isLastStep,
  isValid
}: WizardLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f5f0e8] font-sans">
      <Stepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick} />


      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto">
        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#1e3a5f]/60 uppercase tracking-wider">
                  Paso {currentStep + 1} de {totalSteps}
                </span>
                <span className="text-sm font-medium text-[#1e3a5f]">
                  {Math.round(currentStep / totalSteps * 100)}% Completado
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1e3a5f] transition-all duration-500 ease-out"
                  style={{
                    width: `${currentStep / totalSteps * 100}%`
                  }} />

              </div>
            </div>

            {/* Step Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 min-h-[400px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              {children}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isFirstStep}
              icon={<ChevronLeft className="w-4 h-4" />}>

              Anterior
            </Button>

            <Button
              variant="primary"
              onClick={onNext}
              disabled={!isValid}
              className="min-w-[160px]">

              {isLastStep ?
              <span className="flex items-center">
                  Finalizar <Save className="w-4 h-4 ml-2" />
                </span> :

              <span className="flex items-center">
                  Guardar y Continuar <ChevronRight className="w-4 h-4 ml-2" />
                </span>
              }
            </Button>
          </div>
        </div>
      </main>
    </div>);

}