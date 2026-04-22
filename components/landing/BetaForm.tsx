"use client";

import React, { useState, useEffect } from 'react';

export const BetaForm = ({ initialEmail = "" }: { initialEmail?: string }) => {
  const [email, setEmail] = useState(initialEmail);
  const [submitted, setSubmitted] = useState(false);
  const [counter, setCounter] = useState(67);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setCounter(prev => Math.min(100, prev + 1));
  };

  if (submitted) {
    return (
      <div className="bg-white/10 backdrop-blur p-8 rounded-[2.5rem] border border-white/20 text-center animate-in fade-in zoom-in duration-500">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="font-poppins font-bold text-2xl text-white mb-2">¡Ya estás en la lista!</h3>
        <p className="font-poppins text-white/60">Te avisaremos en cuanto tu plaza esté lista. Revisa tu email: <span className="text-landing-mint">{email}</span></p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com" 
            className="w-full h-14 pl-6 pr-4 bg-white/10 border border-white/20 rounded-2xl font-poppins text-white placeholder:text-white/30 focus:outline-none focus:border-landing-mint transition-colors"
            required
          />
        </div>
        <button 
          type="submit"
          className="h-14 px-8 bg-landing-mint text-landing-navy font-poppins font-bold rounded-2xl hover:shadow-xl hover:shadow-landing-mint/20 transition-all active:scale-95 whitespace-nowrap"
        >
          Unirse a la beta →
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="font-jetbrains text-[10px] uppercase tracking-widest text-white/40">Plazas ocupadas</span>
          <span className="font-poppins font-bold text-landing-mint text-xl">{counter}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-landing-mint transition-all duration-1000 ease-out"
            style={{ width: `${counter}%` }}
          ></div>
        </div>
        <p className="font-poppins text-[10px] text-white/30 text-center">ÚLTIMAS 33 PLAZAS DISPONIBLES PARA EL LANZAMIENTO</p>
      </div>
    </div>
  );
};
