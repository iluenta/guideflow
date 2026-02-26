import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
interface PropiedadData {
  propertyName: string;
  address: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  maxGuests: string;
}
interface PropiedadStepProps {
  data: PropiedadData;
  onChange: (data: Partial<PropiedadData>) => void;
}
export function PropiedadStep({ data, onChange }: PropiedadStepProps) {
  const handleChange = (field: keyof PropiedadData, value: string) => {
    onChange({
      [field]: value
    });
  };
  return (
    <Card
      title="Información de la Propiedad"
      description="Comencemos con los detalles básicos de tu alojamiento.">

      <div className="space-y-6">
        <Input
          label="Nombre de la Propiedad"
          placeholder="Ej: Casa del Mar - Apartamento con vistas"
          value={data.propertyName}
          onChange={(e) => handleChange('propertyName', e.target.value)} />


        <Input
          label="Dirección Completa"
          placeholder="Calle, número, ciudad, código postal"
          value={data.address}
          onChange={(e) => handleChange('address', e.target.value)} />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Tipo de Propiedad"
            value={data.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            options={[
            {
              value: 'apartment',
              label: 'Apartamento'
            },
            {
              value: 'house',
              label: 'Casa'
            },
            {
              value: 'villa',
              label: 'Villa'
            },
            {
              value: 'studio',
              label: 'Estudio'
            },
            {
              value: 'cabin',
              label: 'Cabaña'
            }]
            } />


          <Input
            label="Huéspedes Máximos"
            type="number"
            min="1"
            value={data.maxGuests}
            onChange={(e) => handleChange('maxGuests', e.target.value)} />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Habitaciones"
            type="number"
            min="0"
            value={data.bedrooms}
            onChange={(e) => handleChange('bedrooms', e.target.value)} />


          <Input
            label="Baños"
            type="number"
            min="0"
            step="0.5"
            value={data.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)} />

        </div>
      </div>
    </Card>);

}