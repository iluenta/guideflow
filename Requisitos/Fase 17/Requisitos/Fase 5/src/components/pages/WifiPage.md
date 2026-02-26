import React, { useState } from 'react';
import { PageHeader } from '../PageHeader';
import { Wifi, Copy, Check } from 'lucide-react';
interface WifiPageProps {
  onBack: () => void;
}
export function WifiPage({ onBack }: WifiPageProps) {
  const [copiedNetwork, setCopiedNetwork] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const copyToClipboard = (text: string, type: 'network' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'network') {
      setCopiedNetwork(true);
      setTimeout(() => setCopiedNetwork(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };
  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="WiFi" onBack={onBack} />

      <div className="p-6">
        {/* WiFi Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-cream shadow-soft flex items-center justify-center">
            <Wifi className="w-12 h-12 text-navy" strokeWidth={1.5} />
          </div>
        </div>

        {/* Network Name */}
        <div className="bg-cream rounded-xl p-5 shadow-card mb-4">
          <p className="text-slate text-xs uppercase tracking-wide mb-2">
            Nombre de la red
          </p>
          <div className="flex items-center justify-between">
            <p className="font-serif text-xl text-navy">CasaRefugio_Guest</p>
            <button
              onClick={() => copyToClipboard('CasaRefugio_Guest', 'network')}
              className="p-2 rounded-full bg-beige text-navy hover:bg-beige-dark transition-colors">

              {copiedNetwork ?
              <Check className="w-4 h-4 text-green-600" /> :

              <Copy className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-cream rounded-xl p-5 shadow-card">
          <p className="text-slate text-xs uppercase tracking-wide mb-2">
            Contraseña
          </p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xl text-navy tracking-wider">
              ruralrelax2024
            </p>
            <button
              onClick={() => copyToClipboard('ruralrelax2024', 'password')}
              className="p-2 rounded-full bg-beige text-navy hover:bg-beige-dark transition-colors">

              {copiedPassword ?
              <Check className="w-4 h-4 text-green-600" /> :

              <Copy className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 bg-navy/5 rounded-xl p-4">
          <p className="text-slate text-sm text-center">
            El router está en el salón, detrás de la TV. Si tienes problemas de
            conexión, reinícialo desenchufándolo 10 segundos.
          </p>
        </div>
      </div>
    </div>);

}