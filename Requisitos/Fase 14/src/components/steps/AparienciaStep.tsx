import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Image, Upload } from 'lucide-react';
interface AparienciaData {
  themeColor: string;
  logoUrl: string;
  coverUrl: string;
}
interface AparienciaStepProps {
  data: AparienciaData;
  onChange: (data: Partial<AparienciaData>) => void;
}
export function AparienciaStep({ data, onChange }: AparienciaStepProps) {
  return (
    <Card
      title="Apariencia y Marca"
      description="Personaliza cómo verán tus huéspedes la guía.">

      <div className="space-y-8">
        {/* Color Theme */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Color Principal
          </label>
          <div className="flex flex-wrap gap-3">
            {[
            '#2D6A5A',
            '#1E40AF',
            '#B91C1C',
            '#D97706',
            '#4B5563',
            '#000000'].
            map((color) =>
            <button
              key={color}
              onClick={() =>
              onChange({
                themeColor: color
              })
              }
              className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${data.themeColor === color ? 'border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-300' : 'border-transparent'}`}
              style={{
                backgroundColor: color
              }}
              aria-label={`Select color ${color}`} />

            )}
            <div className="relative">
              <input
                type="color"
                value={data.themeColor}
                onChange={(e) =>
                onChange({
                  themeColor: e.target.value
                })
                }
                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-0 p-0" />

            </div>
          </div>
        </div>

        {/* Logo Upload Placeholder */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Logo de la Propiedad
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Haz clic para subir tu logo
            </p>
            <p className="text-xs text-text-secondary mt-1">
              PNG, JPG (max. 2MB)
            </p>
          </div>
        </div>

        {/* Cover Photo Placeholder */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Foto de Portada
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <Image className="w-12 h-12 text-gray-300" />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <span className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Cambiar Portada
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>);

}