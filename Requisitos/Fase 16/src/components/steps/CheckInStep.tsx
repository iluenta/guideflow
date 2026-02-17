import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Clock, MapPin, Trash2, Plus, Upload } from 'lucide-react';
interface CheckInStepItem {
  id: string;
  title: string;
  type: string;
  description: string;
  isFixed?: boolean;
}
interface CheckInData {
  checkInStart: string;
  checkInEnd: string;
  steps: CheckInStepItem[];
}
interface CheckInStepProps {
  data: CheckInData;
  onChange: (data: Partial<CheckInData>) => void;
}
export function CheckInStep({ data, onChange }: CheckInStepProps) {
  const handleStepChange = (
  id: string,
  field: keyof CheckInStepItem,
  value: string) =>
  {
    const newSteps = data.steps.map((step) =>
    step.id === id ?
    {
      ...step,
      [field]: value
    } :
    step
    );
    onChange({
      steps: newSteps
    });
  };
  const addStep = () => {
    const newStep: CheckInStepItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      type: 'key',
      description: ''
    };
    onChange({
      steps: [...data.steps, newStep]
    });
  };
  const removeStep = (id: string) => {
    onChange({
      steps: data.steps.filter((s) => s.id !== id)
    });
  };
  return (
    <Card
      title="Pasos del Check-in"
      description="Define los pasos que debe seguir el huésped para entrar.">

      <div className="space-y-8">
        {/* Time Section */}
        <div>
          <label className="block text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horario de Check-in Disponible
          </label>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative w-full md:w-1/3">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Clock className="w-4 h-4" />
              </div>
              <input
                value={`${data.checkInStart} - ${data.checkInEnd}`}
                readOnly
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700" />

            </div>
            <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3">
              <div className="w-5 h-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                i
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Contacto de asistencia:</span>{' '}
                Sincronizado automáticamente con tu "Contacto Preferente".
                Puedes cambiarlo en la pestaña anterior.
              </p>
            </div>
          </div>
        </div>

        {/* Steps Section */}
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Pasos Numerados
          </h3>

          <div className="space-y-4">
            {/* Fixed Step 1 */}
            <div className="border border-gray-100 rounded-xl p-4 bg-white flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-text-primary mb-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Dirección (Fijo)
                </div>
                <p className="text-sm text-gray-500">C/ Mayor, 10, Madrid</p>
              </div>
            </div>

            {/* Dynamic Steps */}
            {data.steps.map((step, index) =>
            <div
              key={step.id}
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 2}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                        value={step.title}
                        onChange={(e) =>
                        handleStepChange(step.id, 'title', e.target.value)
                        }
                        placeholder="Título del paso"
                        className="bg-gray-50 border-gray-100 font-bold" />

                      </div>
                      <div className="w-32">
                        <Select
                        value={step.type}
                        onChange={(e) =>
                        handleStepChange(step.id, 'type', e.target.value)
                        }
                        options={[
                        {
                          value: 'key',
                          label: 'Llave'
                        },
                        {
                          value: 'code',
                          label: 'Código'
                        },
                        {
                          value: 'meet',
                          label: 'Encuentro'
                        }]
                        } />

                      </div>
                      <button
                      onClick={() => removeStep(step.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors">

                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <Textarea
                    value={step.description}
                    onChange={(e) =>
                    handleStepChange(step.id, 'description', e.target.value)
                    }
                    placeholder="Describe el paso..."
                    className="bg-gray-50 border-gray-100 min-h-[80px]" />


                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                        <img
                        src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=80"
                        alt="Portal"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />

                      </div>
                      <p className="text-xs text-blue-400 max-w-[200px] leading-relaxed">
                        Sube una foto del portal, del cajetín de llaves o de la
                        puerta para ayudar al huésped.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            onClick={addStep}
            className="w-full mt-4 bg-gray-50 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-100"
            leftIcon={<Plus className="w-4 h-4" />}>

            Añadir otro paso
          </Button>
        </div>
      </div>
    </Card>);

}