import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '../components/StatCard';
import {
  Plus,
  Eye,
  Home,
  BookOpen,
  Calendar,
  ArrowRight,
  MoreHorizontal } from
'lucide-react';
export function Dashboard() {
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
      y: 0
    }
  };
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-navy mb-2">
          Buenos días, Carlos ☀️
        </h1>
        <p className="text-gray-500">
          Aquí tienes el resumen de tu actividad hoy,{' '}
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
          .
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Propiedades Activas"
          value="12"
          trend="2"
          trendDirection="up"
          icon={<Home className="w-5 h-5" />}
          accentColor="#6366F1"
          delay={0} />

        <StatCard
          title="Guías Publicadas"
          value="9"
          trend="1"
          trendDirection="up"
          icon={<BookOpen className="w-5 h-5" />}
          accentColor="#10B981"
          delay={0.1} />

        <StatCard
          title="Visitas Hoy"
          value="247"
          trend="12%"
          trendDirection="up"
          icon={<Eye className="w-5 h-5" />}
          chartData={[
          {
            value: 10
          },
          {
            value: 25
          },
          {
            value: 15
          },
          {
            value: 30
          },
          {
            value: 45
          },
          {
            value: 35
          },
          {
            value: 60
          }]
          }
          accentColor="#F59E0B"
          delay={0.2} />

        <StatCard
          title="Valoración Media"
          value="4.8★"
          trend="0.1"
          trendDirection="up"
          icon={<Calendar className="w-5 h-5" />} // Using Calendar as placeholder for Star
          accentColor="#EC4899"
          delay={0.3} />

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Activity - Takes up 2 columns */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.4
          }}
          className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 p-6">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-bold text-navy">
              Actividad Reciente
            </h2>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
              Ver todo
            </button>
          </div>

          <div className="space-y-6">
            {[
            {
              title: 'Nueva reserva en Villa Sol',
              time: 'Hace 2 horas',
              type: 'booking',
              color: 'bg-indigo-100 text-indigo-600'
            },
            {
              title: 'Guía visualizada por huésped',
              time: 'Hace 3 horas',
              type: 'view',
              color: 'bg-emerald-100 text-emerald-600'
            },
            {
              title: 'Valoración 5★ recibida',
              time: 'Hace 5 horas',
              type: 'review',
              color: 'bg-amber-100 text-amber-600'
            },
            {
              title: 'Mantenimiento completado',
              time: 'Ayer',
              type: 'maintenance',
              color: 'bg-gray-100 text-gray-600'
            }].
            map((activity, i) =>
            <div key={i} className="flex items-start group">
                <div
                className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0 mt-1`}>

                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-navy group-hover:text-indigo-600 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activity.time}
                  </p>
                </div>
                <button className="p-2 text-gray-300 hover:text-navy transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Featured Properties / Health - 1 Column */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.5
          }}
          className="bg-white rounded-xl shadow-card border border-gray-100 p-6">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-bold text-navy">
              Estado de Propiedades
            </h2>
            <button className="p-1 text-gray-400 hover:text-navy">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5">
            {[
            {
              name: 'Villa Macarena',
              score: 98,
              status: 'Excelente'
            },
            {
              name: 'Apartamento Centro',
              score: 85,
              status: 'Bueno'
            },
            {
              name: 'Casa de Playa',
              score: 92,
              status: 'Excelente'
            },
            {
              name: 'Loft Industrial',
              score: 74,
              status: 'Atención'
            }].
            map((prop, i) =>
            <div key={i}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-navy">
                    {prop.name}
                  </span>
                  <span
                  className={`text-xs font-bold ${prop.score > 90 ? 'text-emerald-500' : prop.score > 80 ? 'text-indigo-500' : 'text-amber-500'}`}>

                    {prop.score}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                  className={`h-full rounded-full ${prop.score > 90 ? 'bg-emerald-500' : prop.score > 80 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                  style={{
                    width: `${prop.score}%`
                  }} />

                </div>
              </div>
            )}
          </div>

          <button className="w-full mt-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center">
            Ver reporte completo
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.6
        }}>

        <h2 className="text-lg font-heading font-bold text-navy mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
          {
            label: 'Nueva Propiedad',
            icon: Plus,
            color: 'bg-indigo-600 text-white hover:bg-indigo-700'
          },
          {
            label: 'Crear Guía',
            icon: BookOpen,
            color:
            'bg-white text-navy border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          },
          {
            label: 'Ver Reservas',
            icon: Calendar,
            color:
            'bg-white text-navy border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          },
          {
            label: 'Analíticas',
            icon: BarChart3,
            color:
            'bg-white text-navy border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          }].
          map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                className={`flex items-center justify-center p-4 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${action.color}`}>

                <Icon className="w-5 h-5 mr-2" />
                {action.label}
              </button>);

          })}
        </div>
      </motion.div>
    </div>);

}
// Helper for the chart icon
function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">

      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>);

}