import {
  LucideIcon,
  Minimize2,
  Coffee,
  Zap,
  Waves,
  Crown,
  Home } from
'lucide-react';

export interface Theme {
  id: 'modern' | 'cozy' | 'urban' | 'coastal' | 'luxury' | 'airbnb';
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  previewColor: string;
  previewGradient: string;
}

export const themes: Theme[] = [
{
  id: 'modern',
  name: 'Modern Minimal',
  tagline: 'Limpio · Preciso · Atemporal',
  description: 'Cards flotantes, tipografía Inter, espaciado generoso.',
  icon: Minimize2,
  previewColor: '#1A1A1A',
  previewGradient: 'linear-gradient(135deg, #1A1A1A 0%, #404040 100%)'
},
{
  id: 'cozy',
  name: 'Warm Boutique',
  tagline: 'Acogedor · Personal · Artesanal',
  description: 'Serif elegante, tonos crema, sensación de hogar.',
  icon: Coffee,
  previewColor: '#C4956A',
  previewGradient: 'linear-gradient(135deg, #8B5E3C 0%, #C4956A 100%)'
},
{
  id: 'urban',
  name: 'Urban Dark',
  tagline: 'Oscuro · Editorial · Atrevido',
  description: 'Fondo negro, tipografía condensada, alto contraste.',
  icon: Zap,
  previewColor: '#00E5FF',
  previewGradient: 'linear-gradient(135deg, #0F0F0F 0%, #1C1C1C 100%)'
},
{
  id: 'coastal',
  name: 'Coastal Breeze',
  tagline: 'Fresco · Vibrante · Playful',
  description: 'Azules brillantes, Nunito redondeado, energía costera.',
  icon: Waves,
  previewColor: '#0EA5E9',
  previewGradient: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)'
},
{
  id: 'luxury',
  name: 'Luxury Estate',
  tagline: 'Refinado · Exclusivo · Elegante',
  description: 'Cormorant Garamond, detalles dorados, cinco estrellas.',
  icon: Crown,
  previewColor: '#C9A84C',
  previewGradient: 'linear-gradient(135deg, #1B2A4A 0%, #2D4070 100%)'
},
{
  id: 'airbnb',
  name: 'Airbnb Style',
  tagline: 'Familiar · Amigable · Confiable',
  description: 'El lenguaje visual que todos conocen. Cómodo y directo.',
  icon: Home,
  previewColor: '#FF385C',
  previewGradient: 'linear-gradient(135deg, #FF385C 0%, #FF6B81 100%)'
}];