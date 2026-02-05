import React from 'react';
import { ArrowLeft } from 'lucide-react';
interface PageHeaderProps {
  title: string;
  onBack: () => void;
}
export function PageHeader({ title, onBack }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark px-4 py-4 flex items-center gap-4">
      <button
        onClick={onBack}
        className="p-2 -ml-2 rounded-full hover:bg-beige-dark transition-colors text-navy"
        aria-label="Volver">

        <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
      </button>
      <h1 className="font-serif text-xl font-medium text-navy">{title}</h1>
    </header>);

}