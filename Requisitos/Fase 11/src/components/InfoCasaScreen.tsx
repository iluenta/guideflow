import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Bed, Bath, Users, Info, MapPin } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ScreenHeader } from './ScreenHeader';
interface InfoCasaScreenProps {
  onBack: () => void;
}
const container = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};
const item = {
  hidden: {
    opacity: 0,
    y: 12
  },
  show: {
    opacity: 1,
    y: 0
  }
};
export function InfoCasaScreen({ onBack }: InfoCasaScreenProps) {
  const { themeData } = useTheme();
  const features = [
  {
    icon: Bed,
    label: `${themeData.bedrooms} Dormitorio${themeData.bedrooms > 1 ? 's' : ''}`,
    sub: 'Camas preparadas'
  },
  {
    icon: Bath,
    label: `${themeData.bathrooms} Baño${themeData.bathrooms > 1 ? 's' : ''}`,
    sub: 'Equipados'
  },
  {
    icon: Users,
    label: `Hasta ${themeData.maxGuests} huéspedes`,
    sub: 'Ideal para su estancia'
  }];

  return (
    <motion.div
      className="flex flex-col min-h-full bg-white"
      variants={container}
      initial="hidden"
      animate="show">

      <ScreenHeader title="Info Casa" onBack={onBack} />

      <div className="px-5 pb-10">
        {/* Property Image */}
        <motion.div variants={item} className="mt-6 mb-6">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={themeData.heroImage}
              alt={themeData.propertyName}
              className="w-full h-48 object-cover" />

          </div>
        </motion.div>

        {/* Property Name & Address */}
        <motion.div variants={item} className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            {themeData.propertyName}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            {themeData.address}
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div variants={item} className="space-y-3 mb-10">
          {features.map((feature, i) =>
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 shadow-sm"
            style={{
              backgroundColor: 'var(--color-primary-light)'
            }}>

              <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm"
              style={{
                color: 'var(--color-primary)'
              }}>

                <feature.icon size={22} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{feature.label}</p>
                <p className="text-xs text-gray-500">{feature.sub}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* About */}
        <motion.div variants={item} className="mb-10">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Info
                size={16}
                style={{
                  color: 'var(--color-primary)'
                }} />

              <h3 className="font-serif font-bold text-gray-900">
                Sobre la propiedad
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {themeData.description}
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={item} className="text-center">
          <p className="text-[10px] font-bold text-gray-300 tracking-[0.15em] uppercase">
            Detalles verificados por el anfitrión
          </p>
        </motion.div>
      </div>
    </motion.div>);

}