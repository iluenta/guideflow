import React, { Children } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  Key,
  Wifi,
  AlertTriangle,
  Utensils,
  Calendar,
  ShoppingBag,
  Info,
  FileText,
  Book,
  Clock,
  Star } from
'lucide-react';
import { Card } from './ui/Card';
import { useTheme } from './ThemeProvider';
export type SubScreen = 'info' | 'normas' | 'guia-uso';
interface GuideScreenProps {
  onBack: () => void;
  onNavigate: (screen: SubScreen) => void;
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
export function GuideScreen({ onBack, onNavigate }: GuideScreenProps) {
  const { themeData } = useTheme();
  return (
    <motion.div
      className="flex flex-col min-h-full bg-white"
      variants={container}
      initial="hidden"
      animate="show">

      {/* Header with Hero Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={themeData.heroImage}
          alt={themeData.propertyName}
          className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">

            <ArrowLeft size={20} />
          </button>
          <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
            ES
          </div>
        </div>

        <div className="absolute bottom-4 left-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
            Tu Guía
          </p>
          <h1 className="text-2xl font-serif font-bold">
            {themeData.propertyName}
          </h1>
        </div>
      </div>

      <div className="px-5 pb-10 -mt-6 relative z-10">
        {/* Time-based Suggestion */}
        <motion.div variants={item} className="mb-8">
          <Card className="overflow-hidden border-none shadow-xl">
            <div className="bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="flex items-center gap-2"
                  style={{
                    color: 'var(--color-primary)'
                  }}>

                  <Clock size={16} />
                  <span className="text-xs font-bold tracking-wide">
                    09:23 • BUENOS DÍAS
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 text-white text-[10px] font-bold rounded-full"
                  style={{
                    backgroundColor: 'var(--color-accent)'
                  }}>

                  TIP DEL DÍA
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                El mejor desayuno de {themeData.location.split(',')[0]}
              </h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                No te pierdas el café artesanal en la plaza principal. A solo 5
                minutos caminando.
              </p>

              <button
                className="text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                style={{
                  color: 'var(--color-primary)'
                }}>

                Ver recomendaciones <ChevronRight size={16} />
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Essentials Grid */}
        <motion.div variants={item} className="mb-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Star
              size={12}
              className="text-[var(--color-accent)]"
              fill="currentColor" />

            Lo Indispensable
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              className="flex flex-col items-center justify-center p-4 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
              style={{
                backgroundColor: 'var(--color-primary)'
              }}>

              <Key size={24} className="mb-2 opacity-90" />
              <span className="text-[10px] font-bold tracking-wide uppercase">
                Check In
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-95 transition-transform"
              style={{
                color: 'var(--color-primary)'
              }}>

              <Wifi size={24} className="mb-2" />
              <span className="text-[10px] font-bold tracking-wide uppercase">
                WiFi
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl shadow-sm active:scale-95 transition-transform">
              <AlertTriangle size={24} className="mb-2" />
              <span className="text-[10px] font-bold tracking-wide uppercase">
                SOS
              </span>
            </button>
          </div>
        </motion.div>

        {/* Explore Section */}
        <motion.div variants={item} className="mb-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Descubre {themeData.location.split(',')[0]}
          </h3>
          <div className="space-y-3">
            {[
            {
              icon: Utensils,
              label: 'Gastronomía',
              sub: 'Restaurantes locales'
            },
            {
              icon: Calendar,
              label: 'Actividades',
              sub: 'Qué hacer hoy'
            },
            {
              icon: ShoppingBag,
              label: 'Compras',
              sub: 'Mercados y tiendas'
            }].
            map((action, i) =>
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-gray-200 transition-colors">

                <div className="flex items-center gap-4">
                  <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)'
                  }}>

                    <action.icon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500">{action.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Accommodation Info - Now Navigable */}
        <motion.div variants={item} className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Sobre la Casa
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
            {
              icon: Info,
              label: 'Info',
              screen: 'info' as SubScreen
            },
            {
              icon: FileText,
              label: 'Normas',
              screen: 'normas' as SubScreen
            },
            {
              icon: Book,
              label: 'Manual',
              screen: 'guia-uso' as SubScreen
            }].
            map((navItem, i) =>
            <button
              key={i}
              onClick={() => onNavigate(navItem.screen)}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 active:scale-95 transition-transform hover:bg-gray-100">

                <navItem.icon size={20} className="mb-2 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-600 uppercase">
                  {navItem.label}
                </span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={item} className="mt-8 text-center">
          <p className="text-[10px] font-bold text-gray-300 tracking-[0.2em]">
            POWERED BY GUIDEFLOW
          </p>
        </motion.div>
      </div>
    </motion.div>);

}