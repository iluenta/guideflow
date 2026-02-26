import { ChevronLeft } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface PageHeaderProps {
    title: string;
    onBack: () => void;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function PageHeader({
    title,
    onBack,
    currentLanguage = 'es',
    onLanguageChange
}: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-primary/5 px-4 py-4 flex items-center justify-between">
            <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-primary/5 transition-colors active:scale-90"
            >
                <ChevronLeft className="w-5 h-5 text-primary" />
            </button>

            <h1 className="font-serif text-xl font-bold text-slate-800 tracking-tight max-w-[60%] truncate">
                {title.toUpperCase()}
            </h1>

            {onLanguageChange ? (
                <LanguageSelector
                    currentLanguage={currentLanguage}
                    onLanguageChange={onLanguageChange}
                />
            ) : (
                <div className="w-8 shrink-0" />
            )}
        </div>
    );
}
