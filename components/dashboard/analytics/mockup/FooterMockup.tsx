"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Milestone } from "lucide-react";

export const FooterMockup = () => {
  return (
    <div className="rounded-[3.5rem] p-16 text-white relative overflow-hidden group shadow-[0px_20px_40px_rgba(18,67,64,0.2)] mt-10"
         style={{ background: 'linear-gradient(135deg, #124340 0%, #2D5A57 100%)' }}>
      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-16">
        <div className="space-y-8 max-w-2xl text-center xl:text-left">
          <div className="inline-flex items-center gap-4 px-6 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-xl">
            <Milestone size={14} className="text-teal-300" />
            <span className="text-[10px] font-[800] uppercase tracking-[0.3em] text-teal-100 font-manrope">Intelligence Roadmap</span>
          </div>
          <h3 className="text-4xl md:text-5xl font-[800] font-manrope tracking-tighter leading-tight italic">Anticipating your guest needs before they arise.</h3>
        </div>
        <Button variant="outline" className="rounded-[2rem] border-white/20 text-white hover:bg-white hover:text-[#124340] h-20 px-12 font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-2xl">
           View Full Intelligence <ExternalLink size={20} className="ml-3" />
        </Button>
      </div>
      {/* Dynamic Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-teal-400/5 rounded-full blur-[100px]" />
    </div>
  );
};
