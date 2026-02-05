import React, { useState } from 'react';
import { WizardLayout } from './components/wizard/WizardLayout';
import { Step1Property } from './components/steps/Step1Property';
import { Step2Greeting } from './components/steps/Step2Greeting';
import { Step3Access } from './components/steps/Step3Access';
import { Step4Rules } from './components/steps/Step4Rules';
import { Step5Tech } from './components/steps/Step5Tech';
import { Step6Inventory } from './components/steps/Step6Inventory';
import { Step7Leisure } from './components/steps/Step7Leisure';
import { Step8Faqs } from './components/steps/Step8Faqs';
import { INITIAL_DATA, WizardFormData, STEPS } from './types/wizard';
export function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_DATA);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const updateData = (newData: Partial<WizardFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...newData
    }));
  };
  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Final submit logic would go here
      console.log('Form submitted:', formData);
      alert('¡Configuración guardada con éxito!');
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };
  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    window.scrollTo(0, 0);
  };
  // Simple validation check for the current step
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        // Property
        return !!formData.propertyName && !!formData.location;
      default:
        return true;
      // Other steps are optional or have defaults
    }
  };
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Property data={formData} updateData={updateData} />;
      case 1:
        return <Step2Greeting data={formData} updateData={updateData} />;
      case 2:
        return <Step3Access data={formData} updateData={updateData} />;
      case 3:
        return <Step4Rules data={formData} updateData={updateData} />;
      case 4:
        return <Step5Tech data={formData} updateData={updateData} />;
      case 5:
        return <Step6Inventory data={formData} updateData={updateData} />;
      case 6:
        return <Step7Leisure data={formData} updateData={updateData} />;
      case 7:
        return <Step8Faqs data={formData} updateData={updateData} />;
      default:
        return null;
    }
  };
  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={STEPS.length}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      isFirstStep={currentStep === 0}
      isLastStep={currentStep === STEPS.length - 1}
      isValid={isStepValid()}>

      {renderStep()}
    </WizardLayout>);

}