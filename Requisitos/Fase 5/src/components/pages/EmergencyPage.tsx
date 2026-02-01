import React from 'react';
import { PageHeader } from '../PageHeader';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
interface EmergencyPageProps {
  onBack: () => void;
}
export function EmergencyPage({ onBack }: EmergencyPageProps) {
  const contacts = [
  {
    name: 'Tu anfitrión: María',
    number: '666 123 456',
    whatsapp: true,
    icon: '👤'
  },
  {
    name: 'Emergencias',
    number: '112',
    whatsapp: false,
    icon: '🚨'
  },
  {
    name: 'Hospital La Paz',
    number: '917 277 000',
    whatsapp: false,
    icon: '🏥',
    note: '15 min en coche'
  },
  {
    name: 'Farmacia 24h',
    number: '915 234 567',
    whatsapp: false,
    icon: '💊',
    note: '5 min andando'
  },
  {
    name: 'Urgencias hogar',
    number: '900 123 456',
    whatsapp: false,
    icon: '🔧'
  },
  {
    name: 'Policía local',
    number: '092',
    whatsapp: false,
    icon: '👮'
  }];

  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="Emergency" onBack={onBack} />

      <div className="p-6">
        {/* Warning */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">
            En caso de emergencia grave, llama al <strong>112</strong>
          </p>
        </div>

        {/* Contacts */}
        <div className="space-y-3">
          {contacts.map((contact, i) =>
          <div
            key={i}
            className="bg-cream rounded-xl p-4 shadow-card flex items-center justify-between">

              <div className="flex items-center gap-3">
                <span className="text-2xl">{contact.icon}</span>
                <div>
                  <p className="font-medium text-navy text-sm">
                    {contact.name}
                  </p>
                  {contact.note &&
                <p className="text-slate text-xs">{contact.note}</p>
                }
                </div>
              </div>
              <div className="flex gap-2">
                {contact.whatsapp &&
              <a
                href={`https://wa.me/34${contact.number.replace(/\s/g, '')}`}
                className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">

                    <MessageCircle className="w-5 h-5" />
                  </a>
              }
                <a
                href={`tel:${contact.number.replace(/\s/g, '')}`}
                className="w-10 h-10 rounded-full bg-navy text-cream flex items-center justify-center">

                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

}