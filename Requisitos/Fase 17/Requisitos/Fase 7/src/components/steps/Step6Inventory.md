import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { TextArea, Checkbox, Label } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
const AMENITIES_LIST = [
'Piscina',
'Jacuzzi',
'Barbacoa',
'Jardín',
'Terraza',
'Parking',
'Ascensor',
'Gimnasio',
'Chimenea',
'Aire Acondicionado'];

const APPLIANCES_LIST = [
'Lavadora',
'Secadora',
'Lavavajillas',
'Microondas',
'Cafetera',
'Tostadora',
'Hervidor',
'Plancha',
'Secador de pelo'];

export function Step6Inventory({ data, updateData }: StepProps) {
  const toggleItem = (list: string[], item: string) => {
    return list.includes(item) ?
    list.filter((i) => i !== item) :
    [...list, item];
  };
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Inventario y Servicios
        </h2>
        <p className="text-gray-500">
          ¿Qué pueden encontrar los huéspedes en tu propiedad?
        </p>
      </div>

      <div>
        <Label className="mb-4 block">Amenities Principales</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AMENITIES_LIST.map((item) =>
          <Checkbox
            key={item}
            label={item}
            checked={data.amenities.includes(item)}
            onChange={() =>
            updateData({
              amenities: toggleItem(data.amenities, item)
            })
            } />

          )}
        </div>
      </div>

      <div>
        <Label className="mb-4 block">Electrodomésticos</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {APPLIANCES_LIST.map((item) =>
          <Checkbox
            key={item}
            label={item}
            checked={data.appliances.includes(item)}
            onChange={() =>
            updateData({
              appliances: toggleItem(data.appliances, item)
            })
            } />

          )}
        </div>
      </div>

      <TextArea
        label="Notas adicionales sobre el inventario"
        placeholder="Dónde encontrar las toallas extra, sábanas, productos de limpieza..."
        value={data.inventoryNotes}
        onChange={(e) =>
        updateData({
          inventoryNotes: e.target.value
        })
        } />

    </div>);

}