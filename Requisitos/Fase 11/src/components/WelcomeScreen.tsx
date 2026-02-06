import React, { Children } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Wifi,
  Utensils,
  Key,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowRight } from
'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useTheme } from './ThemeProvider';
interface WelcomeScreenProps {
  onOpenGuide: () => void;
}
const container = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
const item = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 50
    }
  }
};
export function WelcomeScreen({ onOpenGuide }: WelcomeScreenProps) {
  const { themeData } = useTheme();
  return (
    <motion.div
      className="flex flex-col min-h-full bg-white relative"
      variants={container}
      initial="hidden"
      animate="show">

      {/* Hero Section */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <motion.img
          initial={{
            scale: 1.1
          }}
          animate={{
            scale: 1
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut'
          }}
          src={themeData.heroImage}
          alt={themeData.propertyName}
          className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 pb-12 text-white">
          <motion.div variants={item}>
            <p className="text-sm font-medium tracking-widest uppercase opacity-90 mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--color-accent)]" />
              Bienvenido a casa
            </p>
            <h1 className="text-4xl font-bold mb-1 font-serif leading-tight">
              Hola, {themeData.guestNames}
            </h1>
            <p className="text-lg opacity-90 font-light">
              {themeData.propertyName}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Container - Overlapping Hero */}
      <div className="flex-1 px-6 -mt-8 relative z-10 pb-8">
        {/* Search Bar */}
        <motion.div variants={item} className="mb-8">
          <div className="relative group shadow-xl rounded-2xl bg-white overflow-hidden">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--color-primary)]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="¿En qué puedo ayudarte hoy?"
              className="w-full h-16 pl-12 pr-4 bg-white text-gray-800 placeholder-gray-400 outline-none text-base" />

            <div className="absolute inset-y-0 right-2 flex items-center">
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform active:scale-95"
                style={{
                  backgroundColor: 'var(--color-primary)'
                }}>

                <ArrowRight size={20} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3 font-medium">
            Soy tu concierge digital en {themeData.location}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Preguntas Frecuentes
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:scale-110 transition-transform">
                <Wifi size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">WiFi</span>
            </button>
            <button className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:scale-110 transition-transform">
                <Key size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">Acceso</span>
            </button>
            <button className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:scale-110 transition-transform">
                <MapPin size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">Parking</span>
            </button>
            <button className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:scale-110 transition-transform">
                <Utensils size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">Cocina</span>
            </button>
          </div>
        </motion.div>

        {/* Guide Link Card */}
        <motion.div variants={item} className="mt-auto">
          <div
            className="rounded-2xl p-1 relative overflow-hidden group cursor-pointer"
            onClick={onOpenGuide}
            style={{
              background:
              'linear-gradient(135deg, var(--color-primary-light), white)'
            }}>

            <div className="bg-white rounded-xl p-5 border border-[var(--color-primary-light)] relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">
                  Tu Estancia
                </p>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                  Guía de la Casa
                </h3>
                <p className="text-xs text-gray-500">
                  Todo lo que necesitas saber
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)'
                }}>

                <ChevronRight size={20} />
              </div>
            </div>
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