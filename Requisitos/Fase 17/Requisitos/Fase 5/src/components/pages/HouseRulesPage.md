import React from 'react';
import { PageHeader } from '../PageHeader';
import {
  Check,
  X,
  Clock,
  Volume2,
  Cigarette,
  PartyPopper,
  Dog,
  Baby } from
'lucide-react';
interface HouseRulesPageProps {
  onBack: () => void;
}
export function HouseRulesPage({ onBack }: HouseRulesPageProps) {
  const rules = [
  {
    icon: Dog,
    text: 'Mascotas permitidas (pequeñas)',
    allowed: true
  },
  {
    icon: Baby,
    text: 'Niños bienvenidos',
    allowed: true
  },
  {
    icon: Cigarette,
    text: 'No fumar en interior',
    allowed: false
  },
  {
    icon: PartyPopper,
    text: 'No fiestas ni eventos',
    allowed: false
  }];

  const times = [
  {
    label: 'Silencio',
    time: '22:00 - 8:00'
  },
  {
    label: 'Check-in',
    time: '15:00 - 22:00'
  },
  {
    label: 'Check-out',
    time: 'Antes de las 11:00'
  }];

  return (
    <div className="min-h-screen bg-beige">
      <PageHeader title="House Rules" onBack={onBack} />

      <div className="p-6">
        {/* Rules */}
        <div className="space-y-3 mb-8">
          {rules.map((rule, i) =>
          <div
            key={i}
            className="bg-cream rounded-xl p-4 shadow-card flex items-center gap-4">

              <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${rule.allowed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>

                {rule.allowed ?
              <Check className="w-5 h-5" strokeWidth={2} /> :

              <X className="w-5 h-5" strokeWidth={2} />
              }
              </div>
              <p className="text-navy font-medium text-sm">{rule.text}</p>
            </div>
          )}
        </div>

        {/* Times */}
        <h3 className="font-serif text-lg text-navy mb-4">Horarios</h3>
        <div className="bg-cream rounded-xl shadow-card overflow-hidden">
          {times.map((item, i) =>
          <div
            key={i}
            className={`p-4 flex items-center justify-between ${i !== times.length - 1 ? 'border-b border-beige' : ''}`}>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate" strokeWidth={1.5} />
                <span className="text-slate text-sm">{item.label}</span>
              </div>
              <span className="text-navy font-medium text-sm">{item.time}</span>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-8 text-center">
          <p className="text-slate text-sm italic">
            Gracias por respetar estas normas 🙏
          </p>
        </div>
      </div>
    </div>);

}