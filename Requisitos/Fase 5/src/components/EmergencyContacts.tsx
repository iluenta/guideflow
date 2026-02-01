import React from 'react';
import { AlertTriangle, Phone, MessageCircle } from 'lucide-react';
const contacts = [
{
  name: 'Tu anfitrión: María',
  role: 'Para cualquier duda',
  number: '666 123 456',
  whatsapp: true,
  icon: '👤'
},
{
  name: 'Emergencias',
  role: 'Policía, Bomberos, Ambulancia',
  number: '112',
  whatsapp: false,
  icon: '🚨'
},
{
  name: 'Hospital La Paz',
  role: '15 min en coche',
  number: '917 277 000',
  whatsapp: false,
  icon: '🏥'
},
{
  name: 'Farmacia 24h',
  role: '5 min andando',
  number: '915 234 567',
  whatsapp: false,
  icon: '💊'
},
{
  name: 'Urgencias hogar',
  role: 'Fontanería, electricidad',
  number: '900 123 456',
  whatsapp: false,
  icon: '🔧'
},
{
  name: 'Policía Local',
  role: 'Comisaría Centro',
  number: '092',
  whatsapp: false,
  icon: '👮'
}];

export function EmergencyContacts() {
  return (
    <section className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
          <span>🆘</span> Contactos de Emergencia
        </h3>
        <div className="bg-red-100 text-red-600 px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold uppercase">
          <AlertTriangle className="w-3 h-3" />
          Importante
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-stone-50 overflow-hidden divide-y divide-stone-100">
        {contacts.map((contact, index) =>
        <div key={index} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{contact.icon}</span>
              <div>
                <h4 className="font-bold text-charcoal text-sm">
                  {contact.name}
                </h4>
                <p className="text-xs text-stone-500">{contact.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {contact.whatsapp &&
            <button
              className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center active:scale-95 transition-transform"
              aria-label={`WhatsApp ${contact.name}`}>

                  <MessageCircle className="w-5 h-5" />
                </button>
            }
              <button
              className="w-9 h-9 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center active:scale-95 transition-transform"
              aria-label={`Llamar a ${contact.name}`}>

                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>);

}