import React, { useEffect } from 'react';
import { WizardFormData } from '../../types/wizard';
import { Input, TextArea, Label } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step1Property({ data, updateData }: StepProps) {
  // Auto-generate slug from property name
  useEffect(() => {
    if (data.propertyName && !data.slug) {
      const slug = data.propertyName.
      toLowerCase().
      replace(/[^a-z0-9]+/g, '-').
      replace(/(^-|-$)+/g, '');
      updateData({
        slug
      });
    }
  }, [data.propertyName]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Información Básica
        </h2>
        <p className="text-gray-500">
          Configura los datos principales de tu alojamiento para que la IA los
          reconozca.
        </p>
      </div>

      <div className="grid gap-6">
        <Input
          label="Nombre del alojamiento"
          placeholder="Ej: Villa Sol y Mar"
          value={data.propertyName}
          onChange={(e) =>
          updateData({
            propertyName: e.target.value
          })
          }
          required />


        <Input
          label="Ubicación"
          placeholder="Ej: Marbella, España"
          value={data.location}
          onChange={(e) =>
          updateData({
            location: e.target.value
          })
          }
          required />


        <Input
          label="Slug (URL personalizada)"
          placeholder="villa-sol-mar"
          value={data.slug}
          onChange={(e) =>
          updateData({
            slug: e.target.value
          })
          }
          className="bg-gray-50" />


        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Huéspedes"
            type="number"
            min="1"
            value={data.guests}
            onChange={(e) =>
            updateData({
              guests: parseInt(e.target.value) || 0
            })
            } />

          <Input
            label="Hab."
            type="number"
            min="0"
            value={data.bedrooms}
            onChange={(e) =>
            updateData({
              bedrooms: parseInt(e.target.value) || 0
            })
            } />

          <Input
            label="Baños"
            type="number"
            min="0"
            value={data.bathrooms}
            onChange={(e) =>
            updateData({
              bathrooms: parseInt(e.target.value) || 0
            })
            } />

        </div>

        <div>
          <Label>Color de marca</Label>
          <div className="flex items-center gap-4 mt-2">
            <input
              type="color"
              value={data.brandColor}
              onChange={(e) =>
              updateData({
                brandColor: e.target.value
              })
              }
              className="h-12 w-20 p-1 rounded border border-gray-200 cursor-pointer" />

            <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-gray-600 border border-gray-200">
              {data.brandColor}
            </div>
          </div>
        </div>

        <TextArea
          label="Descripción de la propiedad"
          placeholder="Una breve descripción que ayudará a la IA a entender mejor tu alojamiento..."
          value={data.description}
          onChange={(e) =>
          updateData({
            description: e.target.value
          })
          } />

      </div>
    </div>);

}