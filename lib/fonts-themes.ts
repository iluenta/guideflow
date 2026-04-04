import { Playfair_Display, Oswald, Nunito, Cormorant_Garamond, Jost } from 'next/font/google'

// Nota: display: 'swap' permite que el texto sea visible mientras carga la fuente
// En entornos corporativos con proxy SSL, las fuentes pueden fallar en build time
// pero Next.js las cachea después del primer download exitoso

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});

export const oswald = Oswald({
  subsets: ["latin"],
  variable: '--font-oswald',
  display: 'swap',
  preload: true,
});

export const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
  preload: true,
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});

export const jost = Jost({
  subsets: ["latin"],
  variable: '--font-jost',
  display: 'swap',
  preload: true,
});
