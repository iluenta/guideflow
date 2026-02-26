import React from 'react';
import { WizardFormData } from '../../types/wizard';
import { Input, TextArea, Label } from '../ui/Form';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';
interface StepProps {
  data: WizardFormData;
  updateData: (data: Partial<WizardFormData>) => void;
}
export function Step8Faqs({ data, updateData }: StepProps) {
  const addFaq = () => {
    updateData({
      faqs: [
      ...data.faqs,
      {
        question: '',
        answer: ''
      }]

    });
  };
  const removeFaq = (index: number) => {
    const newFaqs = data.faqs.filter((_, i) => i !== index);
    updateData({
      faqs: newFaqs
    });
  };
  const updateFaq = (
  index: number,
  field: 'question' | 'answer',
  value: string) =>
  {
    const newFaqs = [...data.faqs];
    newFaqs[index] = {
      ...newFaqs[index],
      [field]: value
    };
    updateData({
      faqs: newFaqs
    });
  };
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          Preguntas Frecuentes y Contacto
        </h2>
        <p className="text-gray-500">
          Resuelve dudas comunes y facilita ayuda en caso de emergencia.
        </p>
      </div>

      <div className="space-y-6">
        <Input
          label="Teléfono de Emergencia / Contacto"
          placeholder="+34 600 000 000"
          value={data.emergencyContact}
          onChange={(e) =>
          updateData({
            emergencyContact: e.target.value
          })
          } />


        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Preguntas Frecuentes (FAQs)</Label>
            <Button
              type="button"
              variant="secondary"
              onClick={addFaq}
              icon={<Plus className="w-4 h-4" />}>

              Añadir Pregunta
            </Button>
          </div>

          <div className="space-y-4">
            {data.faqs.map((faq, index) =>
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">

                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                  onClick={() => removeFaq(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">

                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <Input
                  placeholder="Pregunta (ej: ¿Dónde tiro la basura?)"
                  value={faq.question}
                  onChange={(e) =>
                  updateFaq(index, 'question', e.target.value)
                  }
                  className="bg-white"
                  fullWidth={false} />

                  <TextArea
                  placeholder="Respuesta..."
                  value={faq.answer}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                  className="bg-white min-h-[80px]" />

                </div>
              </div>
            )}
          </div>
        </div>

        <TextArea
          label="Notas Finales"
          placeholder="Cualquier otra cosa que quieras añadir..."
          value={data.finalNotes}
          onChange={(e) =>
          updateData({
            finalNotes: e.target.value
          })
          } />

      </div>
    </div>);

}