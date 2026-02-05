import React from 'react';
import { ArrowRight } from 'lucide-react';
const saved = [
{
  name: 'Trattoria Roma',
  emoji: '🍕'
},
{
  name: 'Museo del Prado',
  emoji: '🎨'
},
{
  name: 'Ruta tapas La Latina',
  emoji: '🍷'
}];

export function SavedItems() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📌</span> Guardados
      </h3>

      <div className="bg-white rounded-2xl shadow-card border border-stone-50 overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {saved.map((item) =>
          <li
            key={item.name}
            className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors cursor-pointer">

              <span className="text-xl">{item.emoji}</span>
              <span className="text-charcoal font-medium">{item.name}</span>
            </li>
          )}
        </ul>
        <button className="w-full p-3 bg-stone-50 text-terracotta text-sm font-semibold flex items-center justify-center gap-1 hover:bg-stone-100 transition-colors">
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>);

}