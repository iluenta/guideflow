import React from 'react';
import { MessageCircle } from 'lucide-react';
export function HelpButton() {
  return (
    <div className="fixed bottom-24 right-4 z-50 md:right-[calc(50%-220px+1rem)]">
      <button className="group relative flex items-center gap-2 bg-terracotta text-white pl-4 pr-5 py-3 rounded-full shadow-lg shadow-terracotta/30 hover:bg-terracotta/90 transition-all active:scale-95">
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="font-semibold text-sm">¿Necesitas ayuda?</span>
      </button>
    </div>);

}