import React, { useEffect, useState } from 'react';
import { X, Sparkles, UtensilsCrossed, MapPin, HelpCircle } from 'lucide-react';
interface ChatOnboardingProps {
  onOpenChat: () => void;
}
export function ChatOnboarding({ onOpenChat }: ChatOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    // Check if already seen
    const hasSeenOnboarding = localStorage.getItem('chatOnboardingSeen');
    if (!hasSeenOnboarding) {
      // Show after a short delay for smooth entrance
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      // Stagger content animation
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 1100);
      // Auto close after 10 seconds
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => {
        clearTimeout(timer);
        clearTimeout(contentTimer);
        clearTimeout(autoCloseTimer);
      };
    }
  }, []);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('chatOnboardingSeen', 'true');
    }, 400);
  };
  const handleOpenChat = () => {
    handleClose();
    setTimeout(() => {
      onOpenChat();
    }, 400);
  };
  if (!isVisible) return null;
  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-5 transition-all duration-400 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>

      {/* Backdrop with warm tint */}
      <div
        className={`absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose} />


      {/* Modal Card */}
      <div
        className={`relative w-full max-w-[340px] bg-cream rounded-[28px] shadow-2xl overflow-hidden transform transition-all duration-400 ${isClosing ? 'scale-90 translate-y-8 opacity-0' : 'scale-100 translate-y-0 opacity-100'}`}>

        {/* Decorative top accent */}
        <div className="h-2 bg-gradient-to-r from-navy via-navy-light to-navy" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-beige-dark/50 hover:bg-beige-dark flex items-center justify-center text-slate hover:text-navy transition-all z-10">

          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          {/* Welcome Section */}
          <div
            className={`text-center mb-6 transition-all duration-500 delay-100 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Friendly wave emoji with subtle animation */}
            <div className="text-5xl mb-3 inline-block animate-[wave_2s_ease-in-out_infinite]">
              👋
            </div>

            <h2 className="font-serif text-2xl text-navy font-semibold mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-slate text-sm leading-relaxed">
              Soy tu asistente virtual.
              <br />
              Estoy aquí para ayudarte durante tu estancia.
            </p>
          </div>

          {/* Example Questions */}
          <div
            className={`space-y-2.5 mb-6 transition-all duration-500 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            <p className="text-[11px] text-slate/60 font-semibold uppercase tracking-widest text-center mb-3">
              Pregúntame cosas como
            </p>

            <button
              onClick={handleOpenChat}
              className="w-full bg-white hover:bg-white/80 p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group shadow-sm hover:shadow-md active:scale-[0.98]">

              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-navy font-medium">
                "¿Cómo funciona el horno?"
              </span>
            </button>

            <button
              onClick={handleOpenChat}
              className="w-full bg-white hover:bg-white/80 p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group shadow-sm hover:shadow-md active:scale-[0.98]">

              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-sm text-navy font-medium">
                "¿Dónde puedo cenar bien?"
              </span>
            </button>

            <button
              onClick={handleOpenChat}
              className="w-full bg-white hover:bg-white/80 p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group shadow-sm hover:shadow-md active:scale-[0.98]">

              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-sm text-navy font-medium">
                "¿Cómo llego al centro?"
              </span>
            </button>
          </div>

          {/* Status indicator */}
          <div
            className={`flex items-center justify-center gap-2 mb-5 transition-all duration-500 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              Disponible 24/7
            </span>
          </div>

          {/* Actions */}
          <div
            className={`space-y-2.5 transition-all duration-500 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            <button
              onClick={handleOpenChat}
              className="w-full bg-navy hover:bg-navy-light text-white py-4 rounded-2xl font-semibold shadow-lg shadow-navy/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">

              <Sparkles className="w-4 h-4" />
              Hacer una pregunta
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 text-slate hover:text-navy text-sm font-medium transition-colors">

              Explorar la guía primero
            </button>
          </div>
        </div>
      </div>

      {/* Custom wave animation */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }
      `}</style>
    </div>);

}