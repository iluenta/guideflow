import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { SessionWatcher } from "@/components/auth/SessionWatcher";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "../public/fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrains = localFont({
  src: [
    { path: "../public/fonts/jetbrains-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hospyia — Tu guía digital, gestionada por IA",
  description: "Redefiniendo la hospitalidad con inteligencia artificial. Crea guías interactivas para tus huéspedes en minutos.",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${poppins.variable} ${jetbrains.variable} font-sans antialiased`}>
        <SessionWatcher />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
