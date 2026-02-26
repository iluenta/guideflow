import React, { useState, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardStepper, STEPS } from './WizardStepper';
import { WizardNavigation } from './WizardNavigation';
// Step Components
import { PropiedadStep } from './steps/PropiedadStep';
import { AparienciaStep } from './steps/AparienciaStep';
import { AccesoStep } from './steps/AccesoStep';
import { SaludoStep } from './steps/SaludoStep';
import { ContactosStep } from './steps/ContactosStep';
import { CheckInStep } from './steps/CheckInStep';
import { PlaceholderStep } from './steps/PlaceholderStep';
export function PropertyWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  // Form State
  const [formData, setFormData] = useState({
    propiedad: {
      propertyName: '',
      address: '',
      propertyType: 'apartment',
      bedrooms: '',
      bathrooms: '',
      maxGuests: ''
    },
    apariencia: {
      themeColor: '#2D6A5A',
      logoUrl: '',
      coverUrl: ''
    },
    acceso: {
      accessType: 'smartlock',
      accessCode: '',
      wifiName: '',
      wifiPass: '',
      directions: ''
    },
    saludo: {
      welcomeTitle: 'Welcome',
      hostName: '',
      welcomeMessage: 'Please enjoy your stay'
    },
    contactos: {
      contacts: [
      {
        id: '1',
        name: '',
        phone: '',
        role: ''
      }]

    },
    checkin: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      earlyCheckIn: false,
      lateCheckOut: false,
      instructions: ''
    }
  });
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
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
    }
  };
  const handleStepClick = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
          <PropiedadStep
            data={formData.propiedad}
            onChange={(d) => updateFormData('propiedad', d)} />);


      case 1:
        return (
          <AparienciaStep
            data={formData.apariencia}
            onChange={(d) => updateFormData('apariencia', d)} />);


      case 2:
        return (
          <AccesoStep
            data={formData.acceso}
            onChange={(d) => updateFormData('acceso', d)} />);


      case 3:
        return (
          <SaludoStep
            data={formData.saludo}
            onChange={(d) => updateFormData('saludo', d)} />);


      case 4:
        return (
          <ContactosStep
            data={formData.contactos}
            onChange={(d) => updateFormData('contactos', d)} />);


      case 5:
        return (
          <CheckInStep
            data={formData.checkin}
            onChange={(d) => updateFormData('checkin', d)} />);


      default:
        return (
          <PlaceholderStep
            title={STEPS[currentStep].label}
            description="Este paso estará disponible pronto." />);


    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background pt-8 pb-4 text-center px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2 font-serif">
          Configura tu Guía Mágica
        </h1>
        <p className="text-text-secondary text-sm md:text-base max-w-2xl mx-auto">
          Rellena la información para que tu asistente iA pueda ayudar a tus
          huéspedes.
        </p>
      </header>

      {/* Stepper */}
      <WizardStepper
        currentStepIndex={currentStep}
        onStepClick={handleStepClick} />


      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-24 md:pb-12">
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
              duration: 0.3,
              ease: 'easeOut'
            }}>

            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <WizardNavigation
        onNext={handleNext}
        onBack={handleBack}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === STEPS.length - 1} />

    </div>);

}