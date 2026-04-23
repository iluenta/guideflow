"use client";

import React from 'react';

const ITEMS = [
  "Airbnb", "Booking.com", "Expedia", "VRBO", "Housetrip", "Plum Guide", "Kid & Coe",
  "Airbnb", "Booking.com", "Expedia", "VRBO", "Housetrip", "Plum Guide", "Kid & Coe"
];

export const Marquee = () => {
  return (
    <section className="py-[60px] border-y border-landing-rule/50 overflow-hidden">
      <div className="text-center font-jetbrains text-[11px] tracking-[0.2em] uppercase text-landing-ink/30 mb-8">
        Confiado por propietarios de
      </div>
      
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="marquee-track flex items-center gap-12 whitespace-nowrap">
          {ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-12 text-[22px] font-medium font-poppins text-landing-ink/40">
              {item}
              <span className="text-landing-mint text-[22px]">•</span>
            </div>
          ))}
          {/* Duplicate for seamless loop if needed by CSS animation */}
          {ITEMS.map((item, i) => (
            <div key={`dup-${i}`} className="flex items-center gap-12 text-[22px] font-medium font-poppins text-landing-ink/40">
              {item}
              <span className="text-landing-mint text-[22px]">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
