import React from 'react';
import { Theme, themes } from '../data/themes';
import { Check } from 'lucide-react';
interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}
export function ThemeSwitcher({
  currentTheme,
  onThemeChange
}: ThemeSwitcherProps) {
  return (
    <div
      className="bg-white rounded-2xl shadow-xl border border-gray-100 h-full flex flex-col overflow-hidden"
      style={{
        fontFamily: 'Inter, sans-serif'
      }}>

      {/* Header */}
      <div className="px-7 pt-7 pb-5 border-b border-gray-100">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-xl font-bold text-gray-900">
            Guest Guide Studio
          </h2>
        </div>
        <p className="text-sm text-gray-500 leading-snug">
          Mismo contenido. Diferente alma. Cada propiedad merece su propia
          identidad.
        </p>
      </div>

      {/* Theme List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 no-scrollbar">
        {themes.map((theme) => {
          const isActive = currentTheme.id === theme.id;
          const Icon = theme.icon;
          return (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-150 flex items-center gap-4 ${isActive ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'}`}
              style={
              isActive ?
              {
                background: '#FAFAFA',
                ringColor: theme.previewColor,
                outline: `2px solid ${theme.previewColor}`,
                outlineOffset: '2px'
              } :
              {
                background: 'transparent'
              }
              }>

              {/* Color Swatch */}
              <div
                className="h-12 w-12 rounded-xl shrink-0 flex items-center justify-center shadow-sm"
                style={{
                  background: theme.previewGradient
                }}>

                <Icon className="h-5 w-5 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-gray-900">
                    {theme.name}
                  </h3>
                  {isActive &&
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: theme.previewColor
                    }}>

                      <Check className="h-3 w-3 text-white" />
                    </div>
                  }
                </div>
                <p
                  className="text-[11px] font-medium mb-0.5"
                  style={{
                    color: theme.previewColor
                  }}>

                  {theme.tagline}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {theme.description}
                </p>
              </div>
            </button>);

        })}
      </div>

      {/* What changes */}
      <div className="px-7 py-5 border-t border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Lo que cambia con cada tema
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
          'Tipografía',
          'Paleta de color',
          'Estructura de layout',
          'Estilo de tarjetas',
          'Tratamiento del hero',
          'Densidad visual'].
          map((item) =>
          <div key={item} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
              <span className="text-xs text-gray-500">{item}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-7 pb-5">
        <p className="text-[10px] text-center text-gray-300 uppercase tracking-widest font-medium">
          Powered by Magic Patterns
        </p>
      </div>
    </div>);

}