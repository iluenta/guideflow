import { Inter, Manrope, Poppins, JetBrains_Mono } from 'next/font/google'

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

export const poppins = Poppins({
  subsets: ["latin"],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
  display: 'swap',
});
