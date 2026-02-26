import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { Input, TextArea, Select } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step4Rules({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Normas de la Casa
        </h2>
        <p className="text-gray-500">
          Establece las reglas básicas para una buena convivencia.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hora Check-in"
            type="time"
            value={data.checkInTime}
            onChange={(e) =>
            updateData({
              checkInTime: e.target.value
            })
            } />

          <Input
            label="Hora Check-out"
            type="time"
            value={data.checkOutTime}
            onChange={(e) =>
            updateData({
              checkOutTime: e.target.value
            })
            } />

        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Mascotas"
            value={data.petsAllowed}
            onChange={(e) =>
            updateData({
              petsAllowed: e.target.value as any
            })
            }
            options={[
            {
              value: 'no',
              label: 'No permitidas'
            },
            {
              value: 'yes',
              label: 'Permitidas'
            },
            {
              value: 'inquire',
              label: 'Consultar antes'
            }]
            } />

          <Select
            label="Fiestas"
            value={data.partiesAllowed}
            onChange={(e) =>
            updateData({
              partiesAllowed: e.target.value as any
            })
            }
            options={[
            {
              value: 'no',
              label: 'Prohibidas'
            },
            {
              value: 'yes',
              label: 'Permitidas'
            },
            {
              value: 'inquire',
              label: 'Consultar antes'
            }]
            } />

        </div>

        <TextArea
          label="Otras normas importantes"
          placeholder="- No fumar en el interior&#10;- Respetar el descanso de los vecinos a partir de las 22:00&#10;- Tirar la basura antes de salir"
          value={data.houseRules}
          onChange={(e) =>
          updateData({
            houseRules: e.target.value
          })
          }
          className="min-h-[200px]" />

      </div>
    </div>);

}