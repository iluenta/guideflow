import React, { useState, Children } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Clock,
  Trash2,
  Volume2,
  LogOut,
  Wifi,
  WifiOff,
  Droplets,
  Zap,
  Shirt,
  Wind,
  Sparkles as CleanIcon,
  ChevronDown } from
'lucide-react';
import { useTheme } from './ThemeProvider';
import { ScreenHeader } from './ScreenHeader';
interface GuiaUsoScreenProps {
  onBack: () => void;
}
const container = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};
const item = {
  hidden: {
    opacity: 0,
    y: 8
  },
  show: {
    opacity: 1,
    y: 0
  }
};
interface FaqItem {
  icon: React.ElementType;
  question: string;
  answer: string;
}
const faqs: FaqItem[] = [
{
  icon: Key,
  question: '¿Cómo realizo el check-in y dónde recojo las llaves?',
  answer:
  'Te enviaremos las instrucciones detalladas por mensaje el día de tu llegada. Encontrarás una caja de seguridad junto a la puerta principal.'
},
{
  icon: Clock,
  question: '¿Puedo llegar antes de la hora de check-in?',
  answer:
  'El check-in es a partir de las 15:00. Si necesitas llegar antes, consúltanos y haremos lo posible por acomodarte.'
},
{
  icon: Trash2,
  question:
  '¿Dónde debo tirar la basura y cómo debo dejar el alojamiento al salir?',
  answer:
  'Los contenedores están a 50 metros de la entrada. Por favor, deja la basura en los contenedores correspondientes antes de tu salida.'
},
{
  icon: Volume2,
  question:
  '¿Cuáles son las normas con respecto al ruido, especialmente por la noche?',
  answer:
  'El horario de silencio es de 23:00 a 08:00. Por favor, respeta el descanso de los vecinos.'
},
{
  icon: LogOut,
  question:
  '¿A qué hora debo realizar el check-out y qué debo hacer con las llaves?',
  answer:
  'El check-out es a las 11:00. Deja las llaves en la caja de seguridad donde las recogiste.'
},
{
  icon: Wifi,
  question: '¿Cuál es la contraseña de la red WiFi?',
  answer:
  'Red: CasaNieto_5G | Contraseña: Bienvenido2024. La encontrarás también en un cartel junto al router.'
},
{
  icon: WifiOff,
  question: '¿Qué debo hacer si tengo problemas con la conexión WiFi?',
  answer:
  'Reinicia el router (desenchúfalo 30 segundos). Si el problema persiste, escríbenos por el chat.'
},
{
  icon: Droplets,
  question: '¿Qué debo hacer si no tengo agua caliente?',
  answer:
  'Comprueba que el calentador está encendido (interruptor en el baño). Si no funciona, avísanos.'
},
{
  icon: Zap,
  question: '¿Qué debo hacer si se va la luz?',
  answer:
  'El cuadro eléctrico está en la entrada. Sube los interruptores que hayan saltado. Si persiste, llámanos.'
},
{
  icon: Shirt,
  question: '¿Puedo solicitar toallas o ropa de cama extra?',
  answer:
  'Sí, escríbenos por el chat y te las llevaremos lo antes posible sin coste adicional.'
},
{
  icon: Wind,
  question: '¿Hay secador de pelo disponible?',
  answer: 'Sí, encontrarás un secador en el cajón del baño principal.'
},
{
  icon: CleanIcon,
  question: '¿Ofrecen servicio de limpieza durante mi estancia?',
  answer:
  'Para estancias de más de 5 noches, ofrecemos limpieza intermedia. Consúltanos para más detalles.'
}];

function FaqAccordionItem({ faq, index }: {faq: FaqItem;index: number;}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = faq.icon;
  return (
    <motion.div variants={item}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 text-left transition-colors hover:bg-gray-100">

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)'
          }}>

          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-relaxed pr-2">
            {faq.question}
          </p>
          <AnimatePresence>
            {isOpen &&
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
              transition={{
                duration: 0.2
              }}
              className="overflow-hidden">

                <p className="text-sm text-gray-500 leading-relaxed mt-3 pt-3 border-t border-gray-200">
                  {faq.answer}
                </p>
              </motion.div>
            }
          </AnimatePresence>
        </div>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0
          }}
          transition={{
            duration: 0.2
          }}
          className="shrink-0 mt-1">

          <ChevronDown size={16} className="text-gray-400" />
        </motion.div>
      </button>
    </motion.div>);

}
export function GuiaUsoScreen({ onBack }: GuiaUsoScreenProps) {
  return (
    <motion.div
      className="flex flex-col min-h-full bg-white"
      variants={container}
      initial="hidden"
      animate="show">

      <ScreenHeader title="Guía de Uso" onBack={onBack} />

      <div className="px-5 pb-10">
        <motion.div variants={item} className="mt-6 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Preguntas frecuentes
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) =>
          <FaqAccordionItem key={i} faq={faq} index={i} />
          )}
        </div>

        <motion.div variants={item} className="mt-10 text-center">
          <p className="text-[10px] font-bold text-gray-300 tracking-[0.2em]">
            POWERED BY GUIDEFLOW
          </p>
        </motion.div>
      </div>
    </motion.div>);

}