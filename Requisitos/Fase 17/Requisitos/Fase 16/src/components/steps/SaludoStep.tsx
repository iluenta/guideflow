import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
interface SaludoData {
  welcomeTitle: string;
  hostName: string;
  welcomeMessage: string;
}
interface SaludoStepProps {
  data: SaludoData;
  onChange: (data: Partial<SaludoData>) => void;
}
export function SaludoStep({ data, onChange }: SaludoStepProps) {
  const handleChange = (field: keyof SaludoData, value: string) => {
    onChange({
      [field]: value
    });
  };
  return (
    <Card
      title="Saludo de Bienvenida"
      description="Lo primero que verán tus huéspedes al abrir la guía.">

      <div className="space-y-6">
        <Input
          label="Título del Saludo"
          value={data.welcomeTitle}
          onChange={(e) => handleChange('welcomeTitle', e.target.value)}
          className="bg-gray-50 border-gray-200" />


        <Input
          label="Nombre del Anfitrión"
          placeholder="Ej: María & Juan"
          value={data.hostName}
          onChange={(e) => handleChange('hostName', e.target.value)}
          className="bg-gray-50 border-gray-200" />


        <Textarea
          label="Mensaje Personal"
          value={data.welcomeMessage}
          onChange={(e) => handleChange('welcomeMessage', e.target.value)}
          rows={6}
          className="bg-gray-50 border-gray-200" />

      </div>
    </Card>);

}