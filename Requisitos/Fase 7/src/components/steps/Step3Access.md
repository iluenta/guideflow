import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { Input, TextArea, Select } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step3Access({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Acceso y Llegada
        </h2>
        <p className="text-gray-500">
          ¿Cómo entrarán los huéspedes a la propiedad?
        </p>
      </div>

      <div className="grid gap-6">
        <Select
          label="Tipo de Acceso"
          value={data.accessType}
          onChange={(e) =>
          updateData({
            accessType: e.target.value as any
          })
          }
          options={[
          {
            value: 'key',
            label: 'Entrega de llaves en persona'
          },
          {
            value: 'code',
            label: 'Caja de seguridad con código'
          },
          {
            value: 'smart_lock',
            label: 'Cerradura inteligente (Smart Lock)'
          },
          {
            value: 'meet',
            label: 'Punto de encuentro'
          }]
          } />


        {(data.accessType === 'code' || data.accessType === 'smart_lock') &&
        <Input
          label="Código / PIN"
          placeholder="1234"
          value={data.accessCode}
          onChange={(e) =>
          updateData({
            accessCode: e.target.value
          })
          } />

        }

        <TextArea
          label="Instrucciones detalladas"
          placeholder="El código de la caja fuerte es... La llave abre la puerta azul..."
          value={data.accessInstructions}
          onChange={(e) =>
          updateData({
            accessInstructions: e.target.value
          })
          }
          className="min-h-[150px]" />

      </div>
    </div>);

}