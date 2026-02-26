'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Theme } from '@/lib/themes';

interface ThemePreviewCardProps {
    theme: Theme;
    isSelected: boolean;
    onSelect: () => void;
    logoUrl?: string;
    propertyName?: string;
}

export function ThemePreviewCard({
    theme,
    isSelected,
    onSelect,
    logoUrl,
    propertyName
}: ThemePreviewCardProps) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                "relative group rounded-2xl overflow-hidden transition-all duration-300 text-left w-full border-none p-0 bg-transparent outline-none self-start",
                isSelected
                    ? "scale-[1.02] z-10"
                    : "hover:scale-[1.01]"
            )}
        >
            <div className={cn(
                "rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ring-1",
                isSelected
                    ? "ring-primary shadow-xl"
                    : "ring-navy/10 group-hover:ring-navy/20 shadow-md"
            )}>
                {/* Visual Guide Preview Area */}
                <div className="aspect-[4/3] relative overflow-hidden bg-stone-100 p-2">
                    <div
                        className="absolute inset-0 p-2 flex flex-col gap-1.5"
                        style={{ backgroundColor: theme.colors.background }}
                    >
                        {/* Fake Header */}
                        <div
                            className="h-5 w-full rounded shadow-sm flex items-center justify-center px-2 overflow-hidden"
                            style={{ backgroundColor: theme.colors.primary }}
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-2.5 w-auto object-contain brightness-0 invert opacity-90" />
                            ) : (
                                <div className="h-0.5 w-1/3 rounded-full bg-white/30" />
                            )}
                        </div>

                        {/* Fake Content Area */}
                        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                            {/* Welcome Area */}
                            <div className="space-y-0.5 mt-0.5">
                                <div
                                    className="h-1.5 w-1/2 rounded-full"
                                    style={{ backgroundColor: theme.colors.text.primary, opacity: 0.8 }}
                                />
                                <div
                                    className="h-1 w-1/3 rounded-full"
                                    style={{ backgroundColor: theme.colors.text.secondary, opacity: 0.4 }}
                                />
                            </div>

                            {/* Menu Grid Mockup */}
                            <div className="grid grid-cols-3 gap-1 px-0.5">
                                <div className="aspect-square rounded-[4px] shadow-sm" style={{ backgroundColor: theme.colors.surface }} />
                                <div className="aspect-square rounded-[4px] shadow-sm" style={{ backgroundColor: theme.colors.surface }} />
                                <div className="aspect-square rounded-[4px] shadow-sm flex items-center justify-center" style={{ backgroundColor: theme.colors.surface }}>
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.colors.accent, opacity: 0.6 }} />
                                </div>
                            </div>

                            {/* Large Card Mockup */}
                            <div
                                className="h-6 w-full rounded-md shadow-sm border-l-[3px] mt-auto"
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    borderLeftColor: theme.colors.accent
                                }}
                            />
                        </div>
                    </div>

                    {/* Selection Overlay Checkmark */}
                    {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300 z-20">
                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                        </div>
                    )}
                </div>

                {/* Theme Information Row */}
                <div className="p-3 bg-white border-t border-navy/5">
                    <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-serif text-[13px] font-bold text-navy uppercase tracking-tight truncate">
                            {theme.name}
                        </h4>
                    </div>
                    <p className="text-[9px] font-medium text-navy/40 uppercase tracking-widest leading-none mb-2.5">
                        {theme.description}
                    </p>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5">
                        <div
                            className="h-4.5 w-4.5 rounded-full border border-navy/10"
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div
                            className="h-4.5 w-4.5 rounded-full border border-navy/10"
                            style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <div
                            className="h-4.5 w-4.5 rounded-full border border-navy/10"
                            style={{ backgroundColor: theme.colors.accent }}
                        />
                        <div className="ml-auto flex gap-0.5 opacity-30">
                            <div className="w-1.5 h-1.5 rounded-full bg-navy" />
                            <div className="w-1.5 h-1.5 rounded-full bg-navy" />
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
