import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Palette,
  Sparkles,
  Users,
  ListChecks,
  ShieldAlert } from
'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { motion } from 'framer-motion';
interface GuideDashboardProps {
  onBack: () => void;
}
export function GuideDashboard({ onBack }: GuideDashboardProps) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    // Animate progress on mount
    const timer = setTimeout(() => setProgress(40), 100);
    return () => clearTimeout(timer);
  }, []);
  const checklist = [
  {
    label: 'Información básica',
    status: 'completed'
  },
  {
    label: 'Ubicación y Acceso',
    status: 'completed'
  },
  {
    label: 'WiFi y Tecnología',
    status: 'completed'
  },
  {
    label: 'Check-in',
    status: 'completed'
  },
  {
    label: 'Apariencia y Marca',
    status: 'pending'
  },
  {
    label: 'Saludo y Contactos',
    status: 'pending'
  }];

  const enrichmentCards = [
  {
    title: 'Apariencia',
    desc: 'Personaliza colores y logo',
    boost: '+10%',
    icon: Palette,
    color: 'bg-purple-50 text-purple-600',
    action: 'Personalizar'
  },
  {
    title: 'Saludo',
    desc: 'Mensaje de bienvenida',
    boost: '+5%',
    icon: Sparkles,
    color: 'bg-amber-50 text-amber-600',
    action: 'Escribir'
  },
  {
    title: 'Contactos',
    desc: 'Teléfonos de emergencia',
    boost: '+15%',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    action: 'Añadir'
  },
  {
    title: 'Normas',
    desc: 'Reglas de la casa',
    boost: '+10%',
    icon: ShieldAlert,
    color: 'bg-red-50 text-red-600',
    action: 'Definir'
  },
  {
    title: 'Inventario',
    desc: 'Electrodomésticos y menaje',
    boost: '+20%',
    icon: ListChecks,
    color: 'bg-green-50 text-green-600',
    action: 'Revisar'
  }];

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm font-medium">

            <ArrowLeft className="w-4 h-4" /> Volver a propiedades
          </button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}>

              Vista Previa
            </Button>
            <Button size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
              Publicar Guía
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
          {/* Progress Ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="transparent" />

              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="#2D6A5A"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray="364"
                strokeDashoffset={364 - 364 * progress / 100}
                initial={{
                  strokeDashoffset: 364
                }}
                animate={{
                  strokeDashoffset: 364 - 364 * progress / 100
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut'
                }} />

            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {progress}%
              </span>
              <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">
                Completa
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              veratespera
            </h1>
            <div className="flex items-center justify-center md:justify-start text-text-secondary mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span>Vera, Spain</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {checklist.map((item, i) =>
              <div key={i} className="flex items-center gap-2 text-sm">
                  {item.status === 'completed' ?
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> :

                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                }
                  <span
                  className={
                  item.status === 'completed' ?
                  'text-text-primary font-medium' :
                  'text-text-secondary'
                  }>

                    {item.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enrichment Section */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Completa tu guía
          </h2>
          <p className="text-text-secondary mb-6">
            Añade estos detalles para ofrecer una experiencia de 5 estrellas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enrichmentCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    delay: i * 0.1 + 0.5
                  }}>

                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary group">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${card.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                          {card.boost}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-text-primary mb-1">
                        {card.title}
                      </h3>
                      <p className="text-sm text-text-secondary mb-6 flex-1">
                        {card.desc}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full justify-between group-hover:border-primary group-hover:text-primary transition-colors">

                        {card.action}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>);

            })}
          </div>
        </div>
      </div>
    </div>);

}