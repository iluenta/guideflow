"use client";

import React, { useState } from 'react';
import Image from 'next/image';

export const PhoneMockup = () => {
  const [theme, setTheme] = useState<'warm' | 'cold'>('warm');

  return (
    <div className="relative w-full max-w-[450px] mx-auto lg:ml-auto">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-landing-mint/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

      {/* Floating Chips */}
      <div className="absolute top-[15%] -left-[10%] z-20 flex items-center gap-3 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-gray-100 animate-bounce transition-transform hover:scale-110">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <div>
          <p className="font-poppins font-bold text-xs text-landing-navy leading-none">WiFi copiada</p>
          <p className="font-jetbrains text-[9px] text-landing-ink/50 mt-1 uppercase">UN TOQUE</p>
        </div>
      </div>

      <div className="absolute top-[45%] -right-[5%] z-20 flex items-center gap-3 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-gray-100 transition-transform hover:scale-110 animate-[bounce_4s_infinite]">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <div>
          <p className="font-poppins font-bold text-xs text-landing-navy leading-none">HostBot respondió</p>
          <p className="font-jetbrains text-[9px] text-landing-ink/50 mt-1 uppercase">EN 0.8s</p>
        </div>
      </div>

      <div className="absolute bottom-[20%] -left-[5%] z-20 flex items-center gap-3 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-gray-100 transition-transform hover:scale-110 animate-[bounce_5s_infinite]">
        <div className="w-2 h-2 rounded-full bg-landing-mint"></div>
        <div>
          <p className="font-poppins font-bold text-xs text-landing-navy leading-none">Manual generado</p>
          <p className="font-jetbrains text-[9px] text-landing-ink/50 mt-1 uppercase">VIA GEMINI VISION</p>
        </div>
      </div>

      {/* Phone Frame */}
      <div className={`relative aspect-[9/18.5] bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl border-[6px] border-[#333] overflow-hidden transition-all duration-500 ${theme === 'warm' ? 'shadow-orange-500/10' : 'shadow-blue-500/10'}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-[#1a1a1a] rounded-b-2xl z-30"></div>
        
        <div className="relative w-full h-full rounded-[2.2rem] overflow-hidden bg-white">
          <Image 
            src="/images/image_0.png" 
            alt="Hospyia App Screenshot" 
            fill 
            className={`object-cover transition-all duration-700 ${theme === 'cold' ? 'hue-rotate-180 brightness-90' : ''}`}
          />
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="mt-8 flex justify-center gap-4">
        <button 
          onClick={() => setTheme('warm')}
          className={`px-4 py-2 rounded-full font-poppins text-xs font-semibold transition-all ${theme === 'warm' ? 'bg-orange-100 text-orange-600 border-orange-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
        >
          Warm Theme
        </button>
        <button 
          onClick={() => setTheme('cold')}
          className={`px-4 py-2 rounded-full font-poppins text-xs font-semibold transition-all ${theme === 'cold' ? 'bg-blue-100 text-blue-600 border-blue-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
        >
          Cold Theme
        </button>
      </div>
    </div>
  );
};
