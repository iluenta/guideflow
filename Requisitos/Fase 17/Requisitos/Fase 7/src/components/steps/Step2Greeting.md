import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { Input, TextArea } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step2Greeting({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Saludo de Bienvenida
        </h2>
        <p className="text-gray-500">
          Lo primero que verán tus huéspedes al abrir la guía.
        </p>
      </div>

      <div className="grid gap-6">
        <Input
          label="Título del Saludo"
          placeholder="Ej: ¡Bienvenidos a Casa!"
          value={data.greetingTitle}
          onChange={(e) =>
          updateData({
            greetingTitle: e.target.value
          })
          } />


        <Input
          label="Nombre del Anfitrión"
          placeholder="Ej: María & Juan"
          value={data.hostName}
          onChange={(e) =>
          updateData({
            hostName: e.target.value
          })
          } />


        <TextArea
          label="Mensaje Personal"
          placeholder="Esperamos que disfrutéis de vuestra estancia..."
          value={data.personalMessage}
          onChange={(e) =>
          updateData({
            personalMessage: e.target.value
          })
          }
          className="min-h-[200px]" />

      </div>
    </div>);

}