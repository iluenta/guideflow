import React from "react"
import type { Metadata } from 'next'
import { Inter, Playfair_Display, Oswald, Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair'
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: '--font-oswald',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GuideFlow - Gestiona tu Alojamiento Turistico',
  description: 'Plataforma todo en uno para propietarios de alojamientos turisticos. Landing personalizable, calendario de reservas y guia del huesped con IA.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

const SW_SCRIPT = `
  if ('serviceWorker' in navigator) {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(reg) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      // Inyectar el BUILD_ID para que el SW lo use
      self.__BUILD_ID = "${process.env.NEXT_PUBLIC_BUILD_ID || ''}";
    }
  }
`;

import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${oswald.variable} ${nunito.variable} font-sans antialiased bg-beige text-navy`}>
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster />
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </body>
    </html>
  )
}
