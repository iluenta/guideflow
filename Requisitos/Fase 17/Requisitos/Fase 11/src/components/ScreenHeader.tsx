import React from 'react';
import { ArrowLeft } from 'lucide-react';
interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}
export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors -ml-2">

        <ArrowLeft size={20} />
      </button>
      <h2
        className="text-sm font-serif font-bold tracking-wide uppercase"
        style={{
          color: 'var(--color-primary)'
        }}>

        {title}
      </h2>
      <div className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-bold">
        ES
      </div>
    </div>);

}