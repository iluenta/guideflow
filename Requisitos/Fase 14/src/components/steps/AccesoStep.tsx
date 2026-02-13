import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
interface AccesoData {
  accessType: string;
  accessCode: string;
  wifiName: string;
  wifiPass: string;
  directions: string;
}
interface AccesoStepProps {
  data: AccesoData;
  onChange: (data: Partial<AccesoData>) => void;
}
export function AccesoStep({ data, onChange }: AccesoStepProps) {
  return (
    <Card
      title="Acceso y Llegada"
      description="Facilita la llegada de tus huéspedes con instrucciones claras.">

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Tipo de Acceso"
            value={data.accessType}
            onChange={(e) =>
            onChange({
              accessType: e.target.value
            })
            }
            options={[
            {
              value: 'smartlock',
              label: 'Cerradura Inteligente'
            },
            {
              value: 'keybox',
              label: 'Caja de Seguridad'
            },
            {
              value: 'person',
              label: 'Entrega Personal'
            },
            {
              value: 'reception',
              label: 'Recepción 24h'
            }]
            } />


          <Input
            label="Código de Acceso / PIN"
            placeholder="Ej: 1234 #"
            value={data.accessCode}
            onChange={(e) =>
            onChange({
              accessCode: e.target.value
            })
            } />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre WiFi"
            placeholder="Nombre de la red"
            value={data.wifiName}
            onChange={(e) =>
            onChange({
              wifiName: e.target.value
            })
            } />


          <Input
            label="Contraseña WiFi"
            placeholder="Contraseña de la red"
            value={data.wifiPass}
            onChange={(e) =>
            onChange({
              wifiPass: e.target.value
            })
            } />

        </div>

        <Textarea
          label="Instrucciones de Llegada"
          placeholder="Describe cómo llegar desde el aeropuerto o estación, y cómo encontrar la entrada..."
          value={data.directions}
          onChange={(e) =>
          onChange({
            directions: e.target.value
          })
          }
          rows={5} />

      </div>
    </Card>);

}