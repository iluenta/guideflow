import React from 'react';
import { Button } from './ui/Button';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
interface WizardNavigationProps {
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isValid?: boolean;
  isSubmitting?: boolean;
}
export function WizardNavigation({
  onNext,
  onBack,
  isFirstStep,
  isLastStep,
  isValid = true,
  isSubmitting = false
}: WizardNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="w-1/3">
          {!isFirstStep &&
          <Button
            variant="ghost"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-gray-600 hover:text-gray-900 pl-0">

              Anterior
            </Button>
          }
        </div>

        <div className="w-2/3 flex justify-end">
          <Button
            onClick={onNext}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            rightIcon={!isLastStep && <ArrowRight className="w-4 h-4" />}
            leftIcon={isLastStep && <CheckCircle className="w-4 h-4" />}
            className="w-full md:w-auto min-w-[160px]">

            {isLastStep ? 'Finalizar Configuración' : 'Guardar y Continuar'}
          </Button>
        </div>
      </div>
    </div>);

}