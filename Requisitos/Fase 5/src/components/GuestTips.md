import React from 'react';
import { Star, MessageCircle } from 'lucide-react';
const tips = [
{
  text: 'El bar de abajo tiene las mejores croquetas de Madrid!',
  author: 'Carlos',
  date: 'Oct 2024',
  avatar: 'https://i.pravatar.cc/150?u=carlos'
},
{
  text: 'Recomiendo el mercado de San Miguel para desayunar.',
  author: 'Emma',
  date: 'Sep 2024',
  avatar: 'https://i.pravatar.cc/150?u=emma'
},
{
  text: 'La terraza es perfecta para ver el atardecer con un vino.',
  author: 'Pierre',
  date: 'Ago 2024',
  avatar: 'https://i.pravatar.cc/150?u=pierre'
}];

export function GuestTips() {
  return (
    <section className="px-4 mb-8">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>💬</span> Tips de Huéspedes
      </h3>

      <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-4 px-4">
        {tips.map((tip, i) =>
        <div
          key={i}
          className="min-w-[260px] bg-white p-4 rounded-2xl shadow-card border border-stone-50 flex flex-col">

            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) =>
            <Star
              key={star}
              className="w-3 h-3 fill-orange-400 text-orange-400" />

            )}
            </div>
            <p className="text-sm text-charcoal italic mb-4 flex-grow">
              "{tip.text}"
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <img
              src={tip.avatar}
              alt={tip.author}
              className="w-8 h-8 rounded-full bg-stone-200" />

              <div>
                <p className="text-xs font-bold text-charcoal">{tip.author}</p>
                <p className="text-[10px] text-stone-400">{tip.date}</p>
              </div>
            </div>
          </div>
        )}

        <button className="min-w-[100px] flex flex-col items-center justify-center gap-2 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 hover:text-terracotta hover:border-terracotta transition-colors">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">Añadir tip</span>
        </button>
      </div>
    </section>);

}