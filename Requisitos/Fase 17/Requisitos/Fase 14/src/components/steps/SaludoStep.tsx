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
  return (
    <Card
      title="Saludo de Bienvenida"
      description="Lo primero que verán tus huéspedes al abrir la guía.">

      <div className="space-y-6">
        <Input
          label="Título del Saludo"
          placeholder="Welcome"
          value={data.welcomeTitle}
          onChange={(e) =>
          onChange({
            welcomeTitle: e.target.value
          })
          } />


        <Input
          label="Nombre del Anfitrión"
          placeholder="Ej: María & Juan"
          value={data.hostName}
          onChange={(e) =>
          onChange({
            hostName: e.target.value
          })
          } />


        <Textarea
          label="Mensaje Personal"
          placeholder="Please enjoy your stay..."
          value={data.welcomeMessage}
          onChange={(e) =>
          onChange({
            welcomeMessage: e.target.value
          })
          }
          rows={6} />

      </div>
    </Card>);

}