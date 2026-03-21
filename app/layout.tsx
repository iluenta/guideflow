import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'
import { inter } from '@/lib/fonts'
import { Toaster } from "@/components/ui/sonner"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-beige text-navy`}>
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster />
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </body>
    </html>
  )
}
