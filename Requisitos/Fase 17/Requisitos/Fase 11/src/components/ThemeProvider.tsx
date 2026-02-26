import React, { useEffect, useState, createContext, useContext } from 'react';
export type Theme = 'coastal' | 'mountain' | 'urban' | 'sunset';
interface ThemeData {
  '--color-primary': string;
  '--color-primary-light': string;
  '--color-accent': string;
  '--color-bg-page': string;
  propertyName: string;
  location: string;
  address: string;
  guestNames: string;
  heroImage: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  description: string;
}
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  nextTheme: () => void;
  themeData: ThemeData;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const themes: Record<Theme, ThemeData> = {
  coastal: {
    '--color-primary': '#1a3a5c',
    '--color-primary-light': '#eef4f9',
    '--color-accent': '#d4a853',
    '--color-bg-page': '#f9fafb',
    propertyName: 'Casa Nieto',
    location: 'Zahara de los Atunes, Cádiz',
    address: 'Avenida Alcazaba, 115, Vera-Playa, Almería',
    guestNames: 'Sonia y Pedro',
    heroImage:
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    description:
    'Esta es la casa de tus sueños donde encontrarás todo lo necesario para sentirte a gusto. Ubicada a pocos minutos de la playa, con vistas al mar y rodeada de naturaleza.'
  },
  mountain: {
    '--color-primary': '#2d4a22',
    '--color-primary-light': '#eef5ea',
    '--color-accent': '#c4913c',
    '--color-bg-page': '#f5f7f2',
    propertyName: 'El Refugio',
    location: 'Sierra de Grazalema, Cádiz',
    address: 'Camino del Monte, 8, Grazalema, Cádiz',
    guestNames: 'Carlos y María',
    heroImage:
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=600&fit=crop&q=80',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    description:
    'Un refugio de montaña con encanto, perfecto para desconectar. Chimenea, vistas espectaculares y senderos a tu puerta.'
  },
  urban: {
    '--color-primary': '#1a1a2e',
    '--color-primary-light': '#f0f0f5',
    '--color-accent': '#e07a5f',
    '--color-bg-page': '#f7f7f8',
    propertyName: 'Loft Malasaña',
    location: 'Malasaña, Madrid',
    address: 'Calle Velarde, 22, Madrid',
    guestNames: 'Laura y Javi',
    heroImage:
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    description:
    'Loft de diseño en el corazón de Malasaña. Perfecto para parejas que quieren vivir Madrid como un local.'
  },
  sunset: {
    '--color-primary': '#6b2d1a',
    '--color-primary-light': '#fdf3ed',
    '--color-accent': '#d4956b',
    '--color-bg-page': '#fdf6f0',
    propertyName: 'Villa Tramontana',
    location: 'Deià, Mallorca',
    address: 'Carrer de Sa Vinya, 5, Deià, Mallorca',
    guestNames: 'Ana y Miguel',
    heroImage:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    description:
    'Villa mediterránea con piscina privada y vistas a la Serra de Tramuntana. El lugar perfecto para unas vacaciones inolvidables.'
  }
};
export function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setTheme] = useState<Theme>('coastal');
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = themes[theme];
    Object.entries(themeColors).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value as string);
      }
    });
  }, [theme]);
  const nextTheme = () => {
    const themeKeys = Object.keys(themes) as Theme[];
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        nextTheme,
        themeData: themes[theme]
      }}>

      {children}
    </ThemeContext.Provider>);

}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}