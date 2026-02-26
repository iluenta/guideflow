import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Home, Key, Wifi, Clock } from 'lucide-react';
interface BasicosData {
  propertyName: string;
  address: string;
  propertyType: string;
  accessType: string;
  accessCode: string;
  wifiName: string;
  wifiPass: string;
  checkInTime: string;
  checkOutTime: string;
}
interface BasicosStepProps {
  data: BasicosData;
  onChange: (data: Partial<BasicosData>) => void;
}
export function BasicosStep({ data, onChange }: BasicosStepProps) {
  const handleChange = (field: keyof BasicosData, value: string) => {
    onChange({
      [field]: value
    });
  };
  return (
    <Card
      title="Información Esencial"
      description="Lo básico para que tus huéspedes tengan todo al llegar.">

      <div className="space-y-8">
        {/* Propiedad */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-100 pb-2">
            <Home className="w-4 h-4" />
            <h3>Propiedad</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nombre de la Propiedad"
              placeholder="Ej: Casa del Mar"
              value={data.propertyName}
              onChange={(e) => handleChange('propertyName', e.target.value)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Dirección"
                placeholder="Calle, número, ciudad"
                value={data.address}
                onChange={(e) => handleChange('address', e.target.value)} />

              <Select
                label="Tipo"
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
                }]
                } />

            </div>
          </div>
        </section>

        {/* Acceso */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-100 pb-2">
            <Key className="w-4 h-4" />
            <h3>Acceso</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Acceso"
              value={data.accessType}
              onChange={(e) => handleChange('accessType', e.target.value)}
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
              label="Código / PIN"
              placeholder="Ej: 1234 #"
              value={data.accessCode}
              onChange={(e) => handleChange('accessCode', e.target.value)} />

          </div>
        </section>

        {/* WiFi */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-100 pb-2">
            <Wifi className="w-4 h-4" />
            <h3>WiFi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de Red"
              placeholder="WiFi Name"
              value={data.wifiName}
              onChange={(e) => handleChange('wifiName', e.target.value)} />

            <Input
              label="Contraseña"
              placeholder="Password123"
              value={data.wifiPass}
              onChange={(e) => handleChange('wifiPass', e.target.value)} />

          </div>
        </section>

        {/* Horarios */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-100 pb-2">
            <Clock className="w-4 h-4" />
            <h3>Horarios</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check-in"
              type="time"
              value={data.checkInTime}
              onChange={(e) => handleChange('checkInTime', e.target.value)} />

            <Input
              label="Check-out"
              type="time"
              value={data.checkOutTime}
              onChange={(e) => handleChange('checkOutTime', e.target.value)} />

          </div>
        </section>
      </div>
    </Card>);

}