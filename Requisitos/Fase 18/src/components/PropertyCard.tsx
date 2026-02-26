import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Bed, Bath, Star, Edit2, Share2 } from 'lucide-react';
import { Badge } from './Badge';
interface PropertyCardProps {
  title: string;
  location: string;
  image: string;
  stats: {
    guests: number;
    bedrooms: number;
    bathrooms: number;
  };
  rating: number;
  status: 'active' | 'draft' | 'archived';
  guideCompletion: number;
  delay?: number;
}
export function PropertyCard({
  title,
  location,
  image,
  stats,
  rating,
  status,
  guideCompletion,
  delay = 0
}: PropertyCardProps) {
  return (
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
        duration: 0.4,
        delay
      }}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-card hover:shadow-soft transition-all duration-300">

      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

        <div className="absolute top-3 right-3">
          <Badge
            variant={
            status === 'active' ?
            'success' :
            status === 'draft' ?
            'warning' :
            'neutral'
            }>

            {status === 'active' ?
            'Activa' :
            status === 'draft' ?
            'Borrador' :
            'Archivada'}
          </Badge>
        </div>
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center shadow-sm">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
          <span className="text-xs font-bold text-navy">{rating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-bold text-navy mb-1 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {location}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6 py-3 border-y border-gray-50">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-xs font-medium text-gray-600">
              {stats.guests} Guests
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-gray-50">
            <Bed className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-xs font-medium text-gray-600">
              {stats.bedrooms} Beds
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-gray-50">
            <Bath className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-xs font-medium text-gray-600">
              {stats.bathrooms} Baths
            </span>
          </div>
        </div>

        {/* Guide Completion */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-gray-500">
              Guide Completion
            </span>
            <span className="text-xs font-bold text-navy">
              {guideCompletion}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{
                width: 0
              }}
              animate={{
                width: `${guideCompletion}%`
              }}
              transition={{
                duration: 1,
                delay: delay + 0.2
              }}
              className={`h-full rounded-full ${guideCompletion === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />

          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center px-3 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors">
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </button>
          <button className="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>);

}