import React from 'react';
import { Card } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  icon: string;
}
interface FaqsExpressData {
  faqs: FaqItem[];
}
interface FaqsExpressStepProps {
  data: FaqsExpressData;
  onChange: (data: Partial<FaqsExpressData>) => void;
}
export function FaqsExpressStep({ data, onChange }: FaqsExpressStepProps) {
  const toggleFaq = (id: string) => {
    const newFaqs = data.faqs.map((faq) =>
    faq.id === id ?
    {
      ...faq,
      isActive: !faq.isActive
    } :
    faq
    );
    onChange({
      faqs: newFaqs
    });
  };
  const updateAnswer = (id: string, answer: string) => {
    const newFaqs = data.faqs.map((faq) =>
    faq.id === id ?
    {
      ...faq,
      answer
    } :
    faq
    );
    onChange({
      faqs: newFaqs
    });
  };
  return (
    <Card
      title="FAQs Express"
      description="Preguntas que tus huéspedes siempre hacen. Activa las relevantes.">

      <div className="space-y-4">
        {data.faqs.map((faq) =>
        <div
          key={faq.id}
          className={`
              border rounded-xl transition-all duration-300 overflow-hidden
              ${faq.isActive ? 'border-primary bg-white shadow-sm' : 'border-gray-200 bg-gray-50'}
            `}>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{faq.icon}</span>
                <span
                className={`font-medium ${faq.isActive ? 'text-text-primary' : 'text-gray-500'}`}>

                  {faq.question}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                  type="checkbox"
                  checked={faq.isActive}
                  onChange={() => toggleFaq(faq.id)}
                  className="sr-only peer" />

                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <AnimatePresence>
              {faq.isActive &&
            <motion.div
              initial={{
                height: 0,
                opacity: 0
              }}
              animate={{
                height: 'auto',
                opacity: 1
              }}
              exit={{
                height: 0,
                opacity: 0
              }}
              className="border-t border-gray-100">

                  <div className="p-4 pt-2">
                    <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={faq.answer}
                  onChange={(e) => updateAnswer(faq.id, e.target.value)}
                  className="text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  rows={2} />

                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </div>
        )}

        <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-lg flex items-center gap-3 justify-center">
          <span>💬</span>
          <p>Podrás personalizar más preguntas después en tu dashboard.</p>
        </div>
      </div>
    </Card>);

}