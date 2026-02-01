import React, { useState } from 'react';
import { PageHeader } from '../PageHeader';
import { CheckSquare, Clock } from 'lucide-react';
interface CheckOutPageProps {
  onBack: () => void;
}
export function CheckOutPage({ onBack }: CheckOutPageProps) {
  const [checked, setChecked] = useState<number[]>([]);
  const tasks = [
  'Cerrar todas las ventanas',
  'Apagar luces y aire acondicionado',
  'Sacar la basura (contenedores en la calle)',
  'Dejar las llaves sobre la mesa del salón',
  'Cerrar la puerta al salir (sin llave)'];

  const toggleTask = (index: number) => {
    setChecked((prev) =>
    prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };
  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="Check Out" onBack={onBack} />

      <div className="p-6">
        {/* Time */}
        <div className="bg-cream rounded-xl p-5 mb-6 shadow-card text-center">
          <div className="flex items-center justify-center gap-2 text-slate text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Por favor, sal antes de las</span>
          </div>
          <p className="font-serif text-3xl text-navy">11:00</p>
        </div>

        {/* Checklist */}
        <h3 className="font-serif text-lg text-navy mb-4">
          Lista de verificación
        </h3>
        <div className="space-y-3">
          {tasks.map((task, i) =>
          <button
            key={i}
            onClick={() => toggleTask(i)}
            className={`w-full bg-cream rounded-xl p-4 shadow-card flex items-center gap-4 text-left transition-all ${checked.includes(i) ? 'bg-green-50' : ''}`}>

              <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${checked.includes(i) ? 'bg-green-500 border-green-500 text-white' : 'border-slate/30'}`}>

                {checked.includes(i) && <CheckSquare className="w-4 h-4" />}
              </div>
              <span
              className={`text-sm ${checked.includes(i) ? 'text-green-700 line-through' : 'text-navy'}`}>

                {task}
              </span>
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 text-center">
          <p className="text-slate text-sm">
            {checked.length} de {tasks.length} completados
          </p>
          <div className="w-full bg-beige-dark rounded-full h-2 mt-2">
            <div
              className="bg-navy h-2 rounded-full transition-all duration-300"
              style={{
                width: `${checked.length / tasks.length * 100}%`
              }} />

          </div>
        </div>

        {/* Thank you */}
        {checked.length === tasks.length &&
        <div className="mt-8 bg-green-50 rounded-xl p-5 text-center">
            <p className="text-green-700 font-medium">
              ¡Gracias por tu estancia! 🙏
            </p>
            <p className="text-green-600 text-sm mt-1">
              Esperamos verte pronto
            </p>
          </div>
        }
      </div>
    </div>);

}