import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  Sparkles,
  Headphones,
  CheckCircle,
  User,
  Phone,
  Plus } from
'lucide-react';
interface ContactosData {
  supportName: string;
  supportPhone: string;
  supportWhatsapp: string;
  hostName: string;
  hostPhone: string;
  hostWhatsapp: string;
}
interface ContactosStepProps {
  data: ContactosData;
  onChange: (data: Partial<ContactosData>) => void;
}
export function ContactosStep({ data, onChange }: ContactosStepProps) {
  const emergencies = [
  {
    name: '112 - European Emergency Number',
    phone: '112',
    code: '112'
  },
  {
    name: '061 - Servicio de Urgencia Médica Summa 112',
    phone: '061',
    code: '061'
  },
  {
    name: 'Policía Municipal de Madrid',
    phone: '092',
    code: '092'
  },
  {
    name: 'Policía Nacional',
    phone: '091',
    code: '091'
  },
  {
    name: 'Bomberos (Fire Department)',
    phone: '080',
    code: '080'
  },
  {
    name: 'Cruz Roja (Red Cross)',
    phone: '+34913354545',
    code: '+34913354545'
  },
  {
    name: 'Samur Protección Civil',
    phone: '092',
    code: '092'
  },
  {
    name: 'Centro de Información Toxicológica (Toxicología)',
    phone: '+34915620420',
    code: '+34915620420'
  }];

  return (
    <Card
      title="Contactos y Emergencias"
      description="Personas de contacto durante la estancia y servicios de emergencia.">

      <div className="absolute top-6 right-6">
        <Button
          variant="secondary"
          size="sm"
          className="bg-gray-50 border-gray-200 text-xs font-bold"
          leftIcon={<Sparkles className="w-3 h-3" />}>

          AUTOCOMPLETAR EMERGENCIAS
        </Button>
      </div>

      <div className="space-y-8 mt-4">
        {/* Official Support */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <Headphones className="w-3 h-3" />
              SOPORTE OFICIAL
            </div>
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              CONTACTO PREFERENTE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Nombre (Ej: Soporte GuideFlow)
              </label>
              <div className="font-medium text-sm text-text-primary">
                {data.supportName}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Teléfono Principal (Llamadas)
              </label>
              <div className="font-medium text-sm text-text-primary">
                {data.supportPhone}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Teléfono Móvil (WhatsApp)
              </label>
              <div className="font-medium text-sm text-text-primary">
                {data.supportWhatsapp}
              </div>
            </div>
          </div>
        </div>

        {/* Host Contact */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <User className="w-3 h-3" />
              TU CONTACTO (ANFITRIÓN)
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                MARCAR COMO PREFERENTE
              </span>
              <button className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                Sincronizar Teléfono
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User className="w-3 h-3" />
              </div>
              <span className="text-sm font-bold text-text-primary">
                No definido
              </span>
            </div>
            <Input
              placeholder="Ej: 912345678"
              value={data.hostPhone}
              onChange={(e) =>
              onChange({
                hostPhone: e.target.value
              })
              }
              className="bg-gray-50 border-gray-100" />

            <Input
              placeholder="Ej: 666123456"
              value={data.hostWhatsapp}
              onChange={(e) =>
              onChange({
                hostWhatsapp: e.target.value
              })
              }
              className="bg-gray-50 border-gray-100" />

          </div>
        </div>

        {/* Local Emergencies */}
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            <div className="w-3 h-3 rounded-full border border-gray-400 flex items-center justify-center text-[8px]">
              !
            </div>
            EMERGENCIAS LOCALES
          </div>

          <div className="space-y-3">
            {emergencies.map((item, i) =>
            <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {item.name}
                    </span>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600">
                    {item.code}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                  <div className="bg-gray-50 h-8 rounded border border-gray-100 flex items-center px-3 text-xs text-gray-400">
                    Dirección exacta para navegación
                  </div>
                  <div className="bg-gray-50 h-8 rounded border border-gray-100 flex items-center px-3 text-xs text-gray-400">
                    Distancia (ej: 5 min)
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            className="w-full mt-4 bg-gray-50 border-dashed border-gray-300 text-gray-500 text-xs font-medium"
            leftIcon={<Plus className="w-3 h-3" />}>

            Añadir Emergencia
          </Button>
        </div>

        {/* Other Contacts */}
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Plus className="w-3 h-3" />
            OTROS CONTACTOS (TAXI, MANTENIMIENTO...)
          </div>
          <Button
            variant="secondary"
            className="w-full bg-gray-50 border-dashed border-gray-300 text-gray-500 text-xs font-medium"
            leftIcon={<Plus className="w-3 h-3" />}>

            Añadir Contacto
          </Button>
        </div>
      </div>
    </Card>);

}