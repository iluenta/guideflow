import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, Key, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ScreenHeader } from './ScreenHeader';
interface NormasScreenProps {
  onBack: () => void;
}
const container = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};
const item = {
  hidden: {
    opacity: 0,
    y: 10
  },
  show: {
    opacity: 1,
    y: 0
  }
};
interface RuleItem {
  type: 'positive' | 'negative';
  text: string;
}
const rules: RuleItem[] = [
{
  type: 'positive',
  text: 'Estás en tu casa. Por este motivo, cuídala. Si hay algún problema, avísanos.'
},
{
  type: 'positive',
  text: 'Esperamos que disfrute de su estancia. Gracias por dejar el apartamento como lo encontraste.'
},
{
  type: 'negative',
  text: 'No están permitidas fiestas y eventos dentro del apartamento.'
},
{
  type: 'negative',
  text: 'Por favor, no haga ruido en el horario de silencio.'
},
{
  type: 'negative',
  text: 'No tires basura en las papeleras de la urbanización. Cuida de las zonas comunes.'
},
{
  type: 'negative',
  text: 'Por favor, no fume dentro del apartamento.'
}];

const schedules = [
{
  icon: Clock,
  label: 'Silencio',
  time: '23:00 - 08:00'
},
{
  icon: Key,
  label: 'Check-in',
  time: '15:00 a 20:00'
},
{
  icon: LogOut,
  label: 'Check-out',
  time: '11:00'
}];

export function NormasScreen({ onBack }: NormasScreenProps) {
  const { themeData } = useTheme();
  return (
    <motion.div
      className="flex flex-col min-h-full bg-white"
      variants={container}
      initial="hidden"
      animate="show">

      <ScreenHeader title="Normas de la Casa" onBack={onBack} />

      <div className="px-5 pb-10">
        {/* Rules List */}
        <div className="mt-6 space-y-3">
          {rules.map((rule, i) =>
          <motion.div
            key={i}
            variants={item}
            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">

              <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${rule.type === 'positive' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>

                {rule.type === 'positive' ?
              <Check size={16} strokeWidth={3} /> :

              <X size={16} strokeWidth={3} />
              }
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {rule.text}
              </p>
            </motion.div>
          )}
        </div>

        {/* Horarios */}
        <motion.div variants={item} className="mt-10 mb-10">
          <h3
            className="text-2xl font-serif font-bold mb-5"
            style={{
              color: 'var(--color-primary)'
            }}>

            Horarios
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {schedules.map((schedule, i) =>
            <div
              key={i}
              className={`flex items-center justify-between px-5 py-4 ${i < schedules.length - 1 ? 'border-b border-gray-50' : ''}`}>

                <div className="flex items-center gap-3">
                  <schedule.icon
                  size={18}
                  style={{
                    color: 'var(--color-primary)'
                  }} />

                  <span className="text-sm font-medium text-gray-700">
                    {schedule.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {schedule.time}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Thank You */}
        <motion.div variants={item} className="text-center">
          <p
            className="text-base font-serif italic"
            style={{
              color: 'var(--color-primary)'
            }}>

            Gracias por respetar estas normas 🙏
          </p>
        </motion.div>
      </div>
    </motion.div>);

}