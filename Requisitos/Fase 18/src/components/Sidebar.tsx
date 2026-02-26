import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut } from
'lucide-react';
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'properties',
    label: 'Propiedades',
    icon: Building2
  },
  {
    id: 'guides',
    label: 'Guías',
    icon: BookOpen
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: Calendar
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    icon: BarChart3
  },
  {
    id: 'specs',
    label: 'Especificaciones',
    icon: HelpCircle
  } // Added for the requested spec doc
  ];
  const bottomItems = [
  {
    id: 'settings',
    label: 'Ajustes',
    icon: Settings
  }];

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 80 : 260
      }}
      className="h-screen bg-navy text-white flex flex-col border-r border-navy-800 relative z-20 transition-all duration-300 ease-in-out">

      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-navy-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">

              <path
                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />

              <path
                d="M9 22V12H15V22"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />

            </svg>
          </div>
          <motion.span
            animate={{
              opacity: isCollapsed ? 0 : 1
            }}
            className="font-heading font-bold text-xl tracking-tight whitespace-nowrap">

            StayGuide
          </motion.span>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-navy-700 border border-navy-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-indigo-500 transition-colors z-30">

        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative
                ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-navy-300 hover:bg-navy-800 hover:text-white'}
              `}>

              <Icon
                size={20}
                className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-navy-400 group-hover:text-white'}`} />


              <motion.span
                animate={{
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : 'auto'
                }}
                className="ml-3 font-medium whitespace-nowrap overflow-hidden">

                {item.label}
              </motion.span>

              {isActive && !isCollapsed &&
              <motion.div
                layoutId="activeTab"
                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white" />

              }

              {/* Tooltip for collapsed state */}
              {isCollapsed &&
              <div className="absolute left-full ml-2 px-2 py-1 bg-navy-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-navy-600">
                  {item.label}
                </div>
              }
            </button>);

        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-navy-800">
        {bottomItems.map((item) =>
        <button
          key={item.id}
          className="w-full flex items-center px-3 py-3 rounded-lg text-navy-300 hover:bg-navy-800 hover:text-white transition-colors group relative">

            <item.icon
            size={20}
            className="flex-shrink-0 text-navy-400 group-hover:text-white" />

            <motion.span
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : 'auto'
            }}
            className="ml-3 font-medium whitespace-nowrap overflow-hidden">

              {item.label}
            </motion.span>
          </button>
        )}

        <button className="w-full flex items-center px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors mt-1 group relative">
          <LogOut size={20} className="flex-shrink-0" />
          <motion.span
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : 'auto'
            }}
            className="ml-3 font-medium whitespace-nowrap overflow-hidden">

            Cerrar Sesión
          </motion.span>
        </button>
      </div>

      {/* User Profile Snippet */}
      <div
        className={`p-4 border-t border-navy-800 ${isCollapsed ? 'items-center justify-center' : ''} flex`}>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 border-2 border-navy-700" />
        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : 'auto'
          }}
          className="ml-3 overflow-hidden">

          <p className="text-sm font-medium text-white truncate">Carlos M.</p>
          <p className="text-xs text-navy-400 truncate">Superhost</p>
        </motion.div>
      </div>
    </motion.aside>);

}