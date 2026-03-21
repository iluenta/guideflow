import { Playfair_Display, Oswald, Nunito, Cormorant_Garamond, Jost } from 'next/font/google'

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
});

export const oswald = Oswald({
  subsets: ["latin"],
  variable: '--font-oswald',
  display: 'swap',
});

export const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const jost = Jost({
  subsets: ["latin"],
  variable: '--font-jost',
  display: 'swap',
});
