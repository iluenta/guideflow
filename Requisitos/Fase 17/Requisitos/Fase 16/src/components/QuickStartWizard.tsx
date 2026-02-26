import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  MapPin,
  Wifi,
  Key,
  Save } from
'lucide-react';
import { Button } from './ui/Button';
import { InfoBasicaStep } from './steps/InfoBasicaStep';
import { AccesoStep } from './steps/AccesoStep';
import { WifiStep } from './steps/WifiStep';
import { CheckInStep } from './steps/CheckInStep';
interface QuickStartWizardProps {
  onComplete: () => void;
  onBack: () => void;
}
export function QuickStartWizard({
  onComplete,
  onBack
}: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  // Form State
  const [formData, setFormData] = useState({
    info: {
      propertyName: '',
      guests: '2',
      bedrooms: '1',
      bathrooms: '1',
      slug: 'villa-sol-mar',
      description: '',
      imageUrl: ''
    },
    acceso: {
      address: 'C/ Mayor, 10, Madrid'
    },
    wifi: {
      wifiName: 'miwifi',
      wifiPassword: 'Miwifi1234',
      routerNotes: 'El router está debajo de la cama'
    },
    checkIn: {
      checkInStart: '15:00',
      checkInEnd: '22:00',
      steps: [
      {
        id: '1',
        title: 'Punto de encuentro',
        type: 'key',
        description: 'Quedaremos en el punto de encuentro acordado'
      }]

    }
  });
  const steps = [
  {
    id: 'info',
    label: 'Propiedad',
    icon: Home,
    time: '~1 min'
  },
  {
    id: 'acceso',
    label: 'Acceso',
    icon: MapPin,
    time: '~2 min'
  },
  {
    id: 'wifi',
    label: 'WiFi',
    icon: Wifi,
    time: '~1 min'
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: Key,
    time: '~2 min'
  }];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      onComplete();
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      onBack();
    }
  };
  const updateFormData = (section: keyof typeof formData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
  };
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <InfoBasicaStep
            data={formData.info}
            onChange={(d) => updateFormData('info', d)} />);


      case 1:
        return (
          <AccesoStep
            data={formData.acceso}
            onChange={(d) => updateFormData('acceso', d)} />);


      case 2:
        return (
          <WifiStep
            data={formData.wifi}
            onChange={(d) => updateFormData('wifi', d)} />);


      case 3:
        return (
          <CheckInStep
            data={formData.checkIn}
            onChange={(d) => updateFormData('checkIn', d)} />);


      default:
        return null;
    }
  };
  const progress = (currentStep + 1) / steps.length * 100;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header & Stepper */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="h-1 bg-gray-100 w-full">
          <motion.div
            className="h-full bg-primary"
            initial={{
              width: 0
            }}
            animate={{
              width: `${progress}%`
            }}
            transition={{
              duration: 0.5
            }} />

        </div>

        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm font-medium">

              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-text-primary font-serif">
                Configuración Rápida
              </h1>
              <p className="text-xs text-text-secondary hidden md:block">
                Solo lo esencial para que tus huéspedes puedan llegar y entrar.
              </p>
            </div>
            <div className="w-16"></div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -z-10 -translate-y-1/2 hidden md:block" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center bg-white px-2">

                  <div
                    className={`
                      w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                      ${isCurrent ? 'border-primary text-primary ring-4 ring-primary/10 scale-110' : ''}
                      ${!isCompleted && !isCurrent ? 'border-gray-200 text-gray-300' : ''}
                    `}>

                    {isCompleted ?
                    <Check className="w-5 h-5" /> :

                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    }
                  </div>
                  <div className="text-center mt-2 hidden md:block">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>

                      {step.label}
                    </p>
                  </div>
                </div>);

            })}
          </div>

          {/* Mobile Step Label */}
          <div className="md:hidden text-center mt-2">
            <span className="text-sm font-bold text-primary">
              {steps[currentStep].label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{
              x: direction * 20,
              opacity: 0
            }}
            animate={{
              x: 0,
              opacity: 1
            }}
            exit={{
              x: direction * -20,
              opacity: 0
            }}
            transition={{
              duration: 0.3
            }}>

            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={
            currentStep === 0 ? 'invisible' : 'text-gray-500 font-bold'
            }
            leftIcon={<ArrowLeft className="w-4 h-4" />}>

            Anterior
          </Button>

          <Button
            onClick={handleNext}
            className="min-w-[200px] font-bold tracking-wide"
            rightIcon={
            currentStep === steps.length - 1 ?
            <ArrowRight className="w-4 h-4" /> :

            <Save className="w-4 h-4" />

            }>

            {currentStep === steps.length - 1 ?
            'FINALIZAR' :
            'GUARDAR Y CONTINUAR'}
          </Button>
        </div>
      </div>
    </div>);

}