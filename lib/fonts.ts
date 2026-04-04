import { Inter, Manrope } from 'next/font/google'

export const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: '--font-manrope',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});
