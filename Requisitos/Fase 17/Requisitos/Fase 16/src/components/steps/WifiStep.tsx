import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
interface WifiData {
  wifiName: string;
  wifiPassword: string;
  routerNotes: string;
}
interface WifiStepProps {
  data: WifiData;
  onChange: (data: Partial<WifiData>) => void;
}
export function WifiStep({ data, onChange }: WifiStepProps) {
  const handleChange = (field: keyof WifiData, value: string) => {
    onChange({
      [field]: value
    });
  };
  return (
    <Card
      title="WiFi y Tecnología"
      description="Datos de conexión e instrucciones de dispositivos.">

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Red WiFi"
            value={data.wifiName}
            onChange={(e) => handleChange('wifiName', e.target.value)}
            className="bg-gray-50 border-gray-200" />

          <Input
            label="Contraseña WiFi"
            value={data.wifiPassword}
            onChange={(e) => handleChange('wifiPassword', e.target.value)}
            className="bg-gray-50 border-gray-200" />

        </div>

        <Textarea
          label="Ubicación del Router / Notas adicionales"
          value={data.routerNotes}
          onChange={(e) => handleChange('routerNotes', e.target.value)}
          rows={4}
          className="bg-gray-50 border-gray-200" />


        <p className="text-xs text-gray-400 italic">
          Esta información se mostrará en la guía del huésped.
        </p>
      </div>
    </Card>);

}