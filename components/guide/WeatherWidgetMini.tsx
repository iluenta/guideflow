'use client';

import React, { useState, useCallback } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useWeather, CONDITION_ICONS } from '@/hooks/useWeather';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';
import { getGuideTheme } from '@/lib/guide-theme';

interface WeatherWidgetMiniProps {
    lat: number | null | undefined;
    lng: number | null | undefined;
    locationType?: 'coastal' | 'mountain' | 'urban';
    onClick?: () => void;
    themeId?: string;
    currentLanguage?: string;
    accessToken?: string;
    propertyId?: string;
    checkInTime?: string;
    locationName?: string;
}

export function WeatherWidgetMini({
    lat,
    lng,
    locationType = 'urban',
    onClick,
    themeId = 'modern_v2',
    currentLanguage = 'es',
    accessToken,
    propertyId,
    checkInTime,
    locationName,
}: WeatherWidgetMiniProps) {
    const t = getGuideTheme(themeId);
    const lang = currentLanguage;
    // Clave que forzará un nuevo fetch al cambiar
    const [refreshKey, setRefreshKey] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { weather, isLoading, error } = useWeather({
        lat,
        lng,
        locationType,
        refreshKey,
        onFetched: () => {
            setLastUpdated(new Date());
            setIsRefreshing(false);
        },
    });

    const handleRefresh = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // no propagar al onClick del widget
        setIsRefreshing(true);
        setRefreshKey(k => k + 1);
    }, []);

    // Dynamic weather strings (generated in Spanish by useWeather, translated here)
    const primarySource = weather?.contextual.primaryLine ?? '';
    const { content: primaryLine } = useLocalizedContent(primarySource, lang, 'ui', accessToken, propertyId);

    // Static UI strings
    const { content: labelCheckinTitle } = useLocalizedContent('Check-in disponible', lang, 'ui', accessToken, propertyId);
    const { content: labelWeatherAt } = useLocalizedContent('Tiempo en', lang, 'ui', accessToken, propertyId);
    const { content: labelYourDestination } = useLocalizedContent('tu destino', lang, 'ui', accessToken, propertyId);

    if (!lat || !lng) return null;

    // Skeleton mientras carga la primera vez
    if (isLoading && !weather) {
        return (
            <div className={cn("mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-[20px] shadow-sm border px-[18px] py-[14px] flex items-center gap-3 animate-pulse", t.cardBg, t.searchBorder)}>
                <div className={cn("h-11 w-11 rounded-xl shrink-0", t.chipIconBg)} />
                <div className="flex-1 space-y-2">
                    <div className={cn("h-4 rounded w-3/4", t.chipIconBg)} />
                    <div className={cn("h-3 rounded w-1/2", t.chipIconBg)} />
                </div>
            </div>
        );
    }

    if (error || !weather) return null;

    const icon = CONDITION_ICONS[weather.condition];
    const minTemp = weather.hourly?.length 
        ? Math.min(...weather.hourly.map(h => h.temp)) 
        : weather.feelsLike;

    return (
        <div 
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
            className={cn(
                "mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-[20px] shadow-sm border px-[18px] py-[16px] flex items-center transition-all relative z-10", 
                t.cardBg, 
                t.searchBorder,
                onClick && 'cursor-pointer active:scale-[0.98]'
            )}
        >
            {/* Columna Izquierda: Tiempo */}
            <div className="flex-1 min-w-0 pr-4 border-r" style={{ borderColor: 'var(--border, rgba(0,0,0,0.08))' }}>
                <div className={cn("text-[9.5px] font-bold uppercase tracking-[.1em] mb-2 opacity-60", t.sectionLabel)}>
                    {labelWeatherAt} {locationName?.split(',')[0] || labelYourDestination}
                </div>
                <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-[24px] leading-none">{icon}</span>
                    <span className={cn("text-[18px] font-bold tracking-tight", t.guideCardTitle.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
                        {weather.currentTemp}° <span className="text-[14px] font-medium opacity-40">/ {minTemp}°</span>
                    </span>
                </div>
                <div className={cn("text-[11.5px] font-medium truncate opacity-70", t.guideCardSubtitle)}>
                    {primaryLine.split('·')[0].trim()}
                </div>
            </div>

            {/* Columna Derecha: Check-in */}
            <div className="flex-1 min-w-0 pl-4 text-right flex flex-col items-end">
                <div className={cn("text-[9.5px] font-bold uppercase tracking-[.1em] mb-2 opacity-60", t.sectionLabel)}>
                    {labelCheckinTitle}
                </div>
                <div className="text-[16px] font-bold text-[#10B981] tracking-wide mb-1.5">
                    {checkInTime || '15:00 - 22:00'}
                </div>
            </div>
        </div>
    );
}