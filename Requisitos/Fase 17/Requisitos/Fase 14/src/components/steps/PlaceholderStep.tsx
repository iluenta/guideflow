import React from 'react';
import { Card } from '../ui/Card';
import { Construction } from 'lucide-react';
interface PlaceholderStepProps {
  title: string;
  description?: string;
}
export function PlaceholderStep({ title, description }: PlaceholderStepProps) {
  return (
    <Card title={title} description={description}>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Paso en Construcción
        </h3>
        <p className="text-text-secondary max-w-md">
          Este paso del asistente está siendo configurado. Puedes continuar al
          siguiente paso o guardar tu progreso.
        </p>
      </div>
    </Card>);

}