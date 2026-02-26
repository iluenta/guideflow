import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Upload } from 'lucide-react';
interface InfoBasicaData {
  propertyName: string;
  guests: string;
  bedrooms: string;
  bathrooms: string;
  slug: string;
  description: string;
  imageUrl?: string;
}
interface InfoBasicaStepProps {
  data: InfoBasicaData;
  onChange: (data: Partial<InfoBasicaData>) => void;
}
export function InfoBasicaStep({ data, onChange }: InfoBasicaStepProps) {
  const handleChange = (field: keyof InfoBasicaData, value: string) => {
    onChange({
      [field]: value
    });
  };
  return (
    <Card
      title="Información Básica"
      description="Configura los datos principales de tu alojamiento.">

      <div className="space-y-6">
        {/* Main Image */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Imagen principal de tu alojamiento
          </label>
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group cursor-pointer hover:border-primary/50 transition-colors">
            {data.imageUrl ?
            <img
              src={data.imageUrl}
              alt="Property"
              className="w-full h-full object-cover" /> :


            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Subir imagen</span>
              </div>
            }
            {/* Placeholder for the specific image in screenshot */}
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
              alt="Terrace with blue chairs"
              className="w-full h-full object-cover opacity-90" />

          </div>
        </div>

        {/* Property Details Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow md:w-3/5">
            <Input
              label="Nombre del alojamiento"
              placeholder="Ej: Villa Sol y Mar"
              value={data.propertyName}
              onChange={(e) => handleChange('propertyName', e.target.value)} />

          </div>
          <div className="flex gap-4 md:w-2/5">
            <div className="flex-1">
              <Input
                label="Huéspedes"
                type="number"
                value={data.guests}
                onChange={(e) => handleChange('guests', e.target.value)} />

            </div>
            <div className="flex-1">
              <Input
                label="Hab."
                type="number"
                value={data.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)} />

            </div>
            <div className="flex-1">
              <Input
                label="Baños"
                type="number"
                value={data.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)} />

            </div>
          </div>
        </div>

        {/* Slug */}
        <Input
          label="Slug (URL personalizada)"
          value={data.slug}
          onChange={(e) => handleChange('slug', e.target.value)} />


        {/* Description */}
        <Textarea
          label="Descripción de la propiedad"
          placeholder="Una breve descripción que ayudará a la IA a entender mejor tu alojamiento..."
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4} />

      </div>
    </Card>);

}