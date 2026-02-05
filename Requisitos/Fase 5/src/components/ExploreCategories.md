import React from 'react';
import { Home, Smartphone, Pizza, Theater, Train } from 'lucide-react';
const categories = [
{
  icon: Home,
  label: 'Casa'
},
{
  icon: Smartphone,
  label: 'Apps'
},
{
  icon: Pizza,
  label: 'Food'
},
{
  icon: Theater,
  label: 'Ocio'
},
{
  icon: Train,
  label: 'Move'
}];

export function ExploreCategories() {
  return (
    <section className="mb-8">
      <h3 className="px-4 text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📚</span> Explora
      </h3>

      <div className="flex overflow-x-auto no-scrollbar px-4 gap-3 pb-2">
        {categories.map((cat) =>
        <button
          key={cat.label}
          className="flex-shrink-0 flex items-center gap-2 bg-sage text-white px-4 py-2.5 rounded-full shadow-sm active:scale-95 transition-transform">

            <cat.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        )}
      </div>
    </section>);

}