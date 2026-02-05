import React from 'react';
export function HeroSection() {
  return (
    <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80"
        alt="Atardecer rural en El Refugio"
        className="w-full h-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
        <h2 className="text-white text-2xl font-bold leading-tight drop-shadow-md">
          Casa Rural El Refugio
        </h2>
        <p className="text-white/90 text-sm font-medium mt-1 drop-shadow-sm">
          Tu hogar en Madrid
        </p>
      </div>
    </div>);

}