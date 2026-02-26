import React, { useState } from 'react';
import { themes } from './data/themes';
import { GuestGuide } from './components/GuestGuide';
import { ThemeSwitcher } from './components/ThemeSwitcher';
export function App() {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-8 lg:gap-16">
      {/* Phone Frame Container */}
      <div className="relative shrink-0 perspective-1000">
        {/* iPhone Frame */}
        <div className="relative h-[800px] w-[400px] bg-gray-900 rounded-[55px] shadow-2xl border-[8px] border-gray-900 overflow-hidden ring-1 ring-gray-900/50">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[30px] w-[160px] bg-gray-900 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="h-1.5 w-16 bg-gray-800 rounded-full mb-1"></div>
          </div>

          {/* Screen Content */}
          <div className="h-full w-full bg-white overflow-hidden rounded-[48px]">
            <GuestGuide theme={currentTheme} />
          </div>

          {/* Status Bar Time (Simulated) */}
          <div className="absolute top-3 left-8 z-50 text-white text-xs font-medium">
            9:41
          </div>
          {/* Status Bar Icons (Simulated) */}
          <div className="absolute top-3 right-8 z-50 flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-32 bg-black/20 rounded-full z-50 backdrop-blur-sm"></div>
        </div>

        {/* Reflection/Glare Effect */}
        <div className="absolute inset-0 rounded-[55px] pointer-events-none ring-1 ring-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"></div>
      </div>

      {/* Theme Switcher Panel */}
      <div className="w-full max-w-md h-[800px]">
        <ThemeSwitcher
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme} />

      </div>
    </div>);

}