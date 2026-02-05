import React from 'react';
import { Ticket, Music, Trophy, Calendar } from 'lucide-react';
const events = [
{
  title: 'El Rey León',
  place: 'Teatro Lope de Vega',
  date: 'Hoy 20:00',
  icon: Ticket,
  color: 'bg-yellow-100 text-yellow-700'
},
{
  title: 'Real Madrid vs Barcelona',
  place: 'Santiago Bernabéu',
  date: 'Dom 21:00',
  icon: Trophy,
  color: 'bg-blue-100 text-blue-700'
},
{
  title: 'Concierto Rosalía',
  place: 'WiZink Center',
  date: 'Sáb 22:00',
  icon: Music,
  color: 'bg-pink-100 text-pink-700'
}];

export function LocalEvents() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🎭</span> Eventos Destacados
      </h3>

      <div className="space-y-3">
        {events.map((event, i) =>
        <div
          key={i}
          className="bg-white p-4 rounded-2xl shadow-card border border-stone-50 flex items-center justify-between group cursor-pointer active:scale-[0.99] transition-transform">

            <div className="flex items-center gap-4">
              <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${event.color}`}>

                <event.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {event.date}
                  </span>
                </div>
                <h4 className="font-bold text-charcoal text-sm">
                  {event.title}
                </h4>
                <p className="text-xs text-stone-500">{event.place}</p>
              </div>
            </div>
            <button className="text-xs font-bold text-terracotta bg-terracotta/5 px-3 py-1.5 rounded-full hover:bg-terracotta/10 transition-colors">
              Tickets
            </button>
          </div>
        )}
      </div>
    </section>);

}