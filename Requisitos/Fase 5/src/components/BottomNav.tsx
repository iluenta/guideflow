import React from 'react';
import { Home, UtensilsCrossed, MessageCircle, Info } from 'lucide-react';
interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onChatOpen?: () => void;
}
const tabs = [
{
  id: 'home',
  icon: Home,
  label: 'Casa'
},
{
  id: 'eat',
  icon: UtensilsCrossed,
  label: 'Comer'
},
{
  id: 'chat',
  icon: MessageCircle,
  label: 'Chat'
},
{
  id: 'info',
  icon: Info,
  label: 'Info'
}];

export function BottomNav({
  activeTab = 'home',
  onTabChange,
  onChatOpen
}: BottomNavProps) {
  // Haptic feedback helper
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  const handleTabClick = (tabId: string) => {
    triggerHaptic();
    if (tabId === 'chat' && onChatOpen) {
      onChatOpen();
    } else if (onTabChange) {
      onTabChange(tabId);
    }
  };
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] pb-safe z-40">
      <div className="max-w-md mx-auto flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isChat = tab.id === 'chat';
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center gap-1 py-2 px-4 min-w-[72px] transition-all duration-200 ${isActive ? 'text-navy' : isChat ? 'text-navy' : 'text-stone-400 hover:text-stone-600'}`}>

              {/* Active indicator bar */}
              {isActive &&
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-navy rounded-b-full" />
              }

              {/* Chat special styling */}
              {isChat ?
              <div className="relative">
                  <div className="w-10 h-10 -mt-4 bg-navy rounded-full flex items-center justify-center shadow-lg shadow-navy/30 active:scale-95 transition-transform">
                    <tab.icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div> :

              <tab.icon
                className={`w-6 h-6 transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2} />

              }

              <span
                className={`text-[10px] font-medium transition-all duration-200 ${isChat ? 'mt-1' : ''} ${isActive ? 'font-semibold' : ''}`}>

                {tab.label}
              </span>
            </button>);

        })}
      </div>
    </nav>);

}