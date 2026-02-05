import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { TextArea } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step7Leisure({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Ocio y Recomendaciones
        </h2>
        <p className="text-gray-500">
          Comparte tus lugares favoritos con los huéspedes.
        </p>
      </div>

      <div className="grid gap-6">
        <TextArea
          label="Restaurantes Recomendados"
          placeholder="Nombre del restaurante - Tipo de comida - Por qué te gusta"
          value={data.restaurants}
          onChange={(e) =>
          updateData({
            restaurants: e.target.value
          })
          }
          className="min-h-[150px]" />


        <TextArea
          label="Actividades y Cultura"
          placeholder="Museos, rutas de senderismo, monumentos..."
          value={data.activities}
          onChange={(e) =>
          updateData({
            activities: e.target.value
          })
          }
          className="min-h-[150px]" />


        <TextArea
          label="Playas o Puntos de Interés"
          placeholder="Las mejores playas, miradores, parques..."
          value={data.beaches}
          onChange={(e) =>
          updateData({
            beaches: e.target.value
          })
          }
          className="min-h-[150px]" />

      </div>
    </div>);

}