import React from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { ManualsList } from './ManualsList';

interface Manual {
    id: string;
    appliance_name: string;
    brand: string;
    model: string;
    manual_content: string;
}

interface ManualsViewProps {
    onBack: () => void;
    manuals: Manual[];
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function ManualsView({
    onBack,
    manuals,
    currentLanguage = 'es',
    onLanguageChange
}: ManualsViewProps) {
    return (
        <div className="min-h-screen bg-beige font-sans">
            <PageHeader
                title="Manuales"
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-6 space-y-6">
                {/* Manuals Icon */}
                <div className="flex justify-center py-4">
                    <div className="w-24 h-24 rounded-full bg-cream shadow-card flex items-center justify-center border border-navy/5">
                        <BookOpen className="w-12 h-12 text-navy" strokeWidth={1.2} />
                    </div>
                </div>

                {/* Manuals List integration */}
                <div className="space-y-4">
                    {manuals.length > 0 ? (
                        <ManualsList manuals={manuals} />
                    ) : (
                        <div className="bg-cream rounded-2xl p-8 border border-dashed border-navy/10 text-center">
                            <p className="text-slate text-sm font-medium">Aún no se han cargado manuales para esta propiedad.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
