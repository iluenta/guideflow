import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { Input, TextArea } from '../ui/Form';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step5Tech({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          WiFi y Tecnología
        </h2>
        <p className="text-gray-500">
          Ayuda a tus huéspedes a conectarse sin problemas.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-[#1e3a5f] mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />

            </svg>
            Conexión WiFi
          </h3>
          <div className="grid gap-4">
            <Input
              label="Nombre de la red (SSID)"
              placeholder="MiCasa_WiFi"
              value={data.wifiName}
              onChange={(e) =>
              updateData({
                wifiName: e.target.value
              })
              } />

            <Input
              label="Contraseña"
              type="text"
              placeholder="clave1234"
              value={data.wifiPassword}
              onChange={(e) =>
              updateData({
                wifiPassword: e.target.value
              })
              } />

          </div>
        </div>

        <TextArea
          label="Instrucciones Smart TV / Streaming"
          placeholder="Cómo usar Netflix, canales locales, HDMI..."
          value={data.tvInstructions}
          onChange={(e) =>
          updateData({
            tvInstructions: e.target.value
          })
          } />


        <TextArea
          label="Otros dispositivos (Altavoces, Termostato...)"
          placeholder="Instrucciones para el aire acondicionado, calefacción, etc."
          value={data.otherDevices}
          onChange={(e) =>
          updateData({
            otherDevices: e.target.value
          })
          } />

      </div>
    </div>);

}