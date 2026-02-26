import React from 'react';
import { Search, Bell, HelpCircle, Plus } from 'lucide-react';
export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar propiedades, guías o reservas..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400" />

        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-4">
        <button className="hidden md:flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
          <Plus className="w-4 h-4 mr-1.5" />
          Acción Rápida
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        <button className="p-2 text-gray-400 hover:text-navy hover:bg-gray-50 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-2 text-gray-400 hover:text-navy hover:bg-gray-50 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>);

}