import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-stone-100 shadow-sm px-4 py-3 flex items-center justify-between">
      <button
        className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-charcoal"
        aria-label="Menu">

        <Menu className="w-6 h-6" />
      </button>

      <h1 className="text-lg font-semibold text-charcoal tracking-tight">
        Casa Rural El Refugio
      </h1>

      <button
        className="flex items-center gap-1 text-sm font-medium text-charcoal hover:text-terracotta transition-colors px-2 py-1 rounded-md"
        aria-label="Select language">

        ES
        <ChevronDown className="w-4 h-4" />
      </button>
    </header>);

}