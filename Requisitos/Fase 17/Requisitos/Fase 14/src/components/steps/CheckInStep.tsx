import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
interface CheckInData {
  checkInTime: string;
  checkOutTime: string;
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
  instructions: string;
}
interface CheckInStepProps {
  data: CheckInData;
  onChange: (data: Partial<CheckInData>) => void;
}
export function CheckInStep({ data, onChange }: CheckInStepProps) {
  return (
    <Card
      title="Horarios de Check-in / Check-out"
      description="Define las reglas de entrada y salida.">

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Hora de Check-in"
            type="time"
            value={data.checkInTime}
            onChange={(e) =>
            onChange({
              checkInTime: e.target.value
            })
            } />


          <Input
            label="Hora de Check-out"
            type="time"
            value={data.checkOutTime}
            onChange={(e) =>
            onChange({
              checkOutTime: e.target.value
            })
            } />

        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.earlyCheckIn}
              onChange={(e) =>
              onChange({
                earlyCheckIn: e.target.checked
              })
              }
              className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />

            <span className="text-sm text-text-primary">
              Permitir Early Check-in (bajo petición)
            </span>
          </label>

          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.lateCheckOut}
              onChange={(e) =>
              onChange({
                lateCheckOut: e.target.checked
              })
              }
              className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />

            <span className="text-sm text-text-primary">
              Permitir Late Check-out (bajo petición)
            </span>
          </label>
        </div>

        <Textarea
          label="Instrucciones Adicionales"
          placeholder="Detalles sobre dónde dejar las llaves, basura, etc."
          value={data.instructions}
          onChange={(e) =>
          onChange({
            instructions: e.target.value
          })
          }
          rows={4} />

      </div>
    </Card>);

}