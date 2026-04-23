"use client";

import React from 'react';

export const PhoneMockup = () => {
  return (
    <div className="phone-stage">
      {/* Background glow from Landing.html */}
      <div className="absolute inset-0 bg-radial-gradient from-[rgba(94,234,212,0.18)] to-transparent blur-[100px] z-0"></div>

      {/* Chips exactly like Landing.html */}
      <div className="float-chip chip-1">
        <span className="w-2 h-2 rounded-full bg-landing-navy"></span>
        <div>
          <strong className="block text-landing-navy text-[12px] font-bold">WiFi copiada</strong>
          <small className="block font-jetbrains text-[9px] text-landing-ink/40 tracking-wider">UN TOQUE</small>
        </div>
      </div>

      <div className="float-chip chip-2">
        <span className="w-2 h-2 rounded-full bg-[oklch(0.75_0.15_145)]"></span>
        <div>
          <strong className="block text-landing-navy text-[12px] font-bold">HostBot respondió</strong>
          <small className="block font-jetbrains text-[9px] text-landing-ink/40 tracking-wider">EN 0.8s</small>
        </div>
      </div>

      <div className="float-chip chip-3">
        <span className="w-2 h-2 rounded-full bg-landing-mint"></span>
        <div>
          <strong className="block text-landing-navy text-[12px] font-bold">Manual generado</strong>
          <small className="block font-jetbrains text-[9px] text-landing-ink/40 tracking-wider">VIA GEMINI VISION</small>
        </div>
      </div>

      {/* Phone exactly like Landing.html CSS - but STRAIGHTened */}
      <div 
        className="phone"
        id="phone"
        data-theme="warm"
      >
        <div className="phone-screen">
          <div className="phone-notch"></div>
          <div className="phone-content phone-content-img">
            {/* The image here remains guia-1.png unless you prefer another one */}
            <img src="/guia-1.png" alt="Hospyia guest guide preview" className="phone-img" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .phone-stage {
          position: relative;
          perspective: 2000px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 680px;
        }

        .phone {
          width: 300px;
          height: 600px;
          background: #0a0a0a;
          border-radius: 44px;
          padding: 8px;
          position: relative;
          z-index: 2;
          box-shadow: 
            0 1px 0 rgba(255,255,255,0.1) inset,
            0 40px 100px -20px rgba(0,0,0,0.4),
            0 20px 50px -10px rgba(0,0,0,0.3);
          transform-style: preserve-3d;
          /* Rotation removed to keep it straight as requested */
          transform: rotateY(0deg) rotateX(0deg);
          transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1);
        }

        .phone:hover {
          transform: scale(1.02);
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          background: #fbf8f2;
          border-radius: 36px;
          overflow: hidden;
          position: relative;
        }

        .phone-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 24px;
          background: #0a0a0a;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          z-index: 10;
        }

        .phone-content {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .phone-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }

        .float-chip {
          position: absolute;
          background: #fafbfc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 8px 24px -8px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 3;
          animation: float 6s ease-in-out infinite;
        }

        .chip-1 { top: 15%; left: -10%; }
        .chip-2 { top: 55%; right: -15%; animation-delay: 1s; }
        .chip-3 { bottom: 10%; left: -5%; animation-delay: 0.5s; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};
