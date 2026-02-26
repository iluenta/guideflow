import React from 'react';
import {
  Check,
  Home,
  Sparkles,
  Key,
  ShieldAlert,
  Wifi,
  Utensils,
  HelpCircle,
  BoxIcon } from
'lucide-react';
import { STEPS } from '../../types/wizard';
const ICONS: Record<string, React.ElementType> = {
  Home,
  Sparkles,
  Key,
  ShieldAlert,
  Wifi,
  BoxIcon,
  Utensils,
  HelpCircle
};
interface StepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (index: number) => void;
}
export function Stepper({
  currentStep,
  completedSteps,
  onStepClick
}: StepperProps) {
  return (
    <nav className="w-full lg:w-72 bg-white lg:min-h-screen border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-[#1e3a5f] text-lg leading-tight">
              Guía Mágica
            </h1>
            <p className="text-xs text-gray-500">Configuración</p>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="lg:hidden mb-4">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
            <span>
              Paso {currentStep + 1} de {STEPS.length}
            </span>
            <span>{Math.round((currentStep + 1) / STEPS.length * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a5f] transition-all duration-500 ease-out"
              style={{
                width: `${(currentStep + 1) / STEPS.length * 100}%`
              }} />

          </div>
        </div>

        {/* Desktop Stepper / Mobile Scrollable List */}
        <ul className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-4 lg:gap-0 pb-4 lg:pb-0 hide-scrollbar">
          {STEPS.map((step, index) => {
            const Icon = ICONS[step.icon];
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;
            const isClickable = isCompleted || index === currentStep;
            return (
              <li key={step.id} className="flex-shrink-0 lg:w-full">
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`group flex items-center w-full p-3 rounded-lg transition-all duration-200 text-left
                    ${isCurrent ? 'bg-[#1e3a5f]/5 ring-1 ring-[#1e3a5f]/20' : ''}
                    ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                  `}>

                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors duration-200
                    ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-400'}
                  `}>

                    {isCompleted ?
                    <Check className="w-4 h-4" /> :
                    Icon ?
                    <Icon className="w-4 h-4" /> :

                    <span className="w-4 h-4" />
                    }
                  </div>
                  <div className="hidden lg:block">
                    <span
                      className={`block text-sm font-medium ${isCurrent ? 'text-[#1e3a5f]' : 'text-gray-600'}`}>

                      {step.label}
                    </span>
                  </div>
                  {/* Mobile Label (only for current) */}
                  <div className="lg:hidden">
                    {isCurrent &&
                    <span className="text-sm font-medium text-[#1e3a5f] pr-2">
                        {step.label}
                      </span>
                    }
                  </div>
                </button>

                {/* Connector Line (Desktop only) */}
                {index < STEPS.length - 1 &&
                <div className="hidden lg:block ml-[1.125rem] w-px h-4 bg-gray-200 my-1" />
                }
              </li>);

          })}
        </ul>
      </div>
    </nav>);

}