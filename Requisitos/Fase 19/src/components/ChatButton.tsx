import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Theme } from '../data/themes';
interface ChatButtonProps {
  theme: Theme;
}
export function ChatButton({ theme }: ChatButtonProps) {
  // Each theme has its own chat button personality
  const configs: Record<
    string,
    {
      bg: string;
      color: string;
      shape: string;
      extra?: string;
    }> =
  {
    modern: {
      bg: '#1A1A1A',
      color: '#fff',
      shape: '50%'
    },
    cozy: {
      bg: '#8B5E3C',
      color: '#FDF6EE',
      shape: '16px'
    },
    urban: {
      bg: '#00E5FF',
      color: '#000',
      shape: '0px'
    },
    coastal: {
      bg: '#0EA5E9',
      color: '#fff',
      shape: '50%'
    },
    luxury: {
      bg: '#1B2A4A',
      color: '#C9A84C',
      shape: '0px',
      extra: '1px solid #C9A84C'
    }
  };
  const c = configs[theme.id] || configs.modern;
  return (
    <button
      className="absolute bottom-6 right-5 h-14 w-14 flex items-center justify-center z-50 hover:scale-105 transition-transform shadow-lg"
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: c.shape,
        border: c.extra || 'none',
        boxShadow: theme.id === 'urban' ? 'none' : undefined
      }}
      aria-label="Chat with host">

      <MessageCircle className="h-6 w-6" />
    </button>);

}