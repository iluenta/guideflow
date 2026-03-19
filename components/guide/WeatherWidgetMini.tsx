'use client';

import React, { useState, useCallback } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useWeather, CONDITION_ICONS } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';
import { getGuideTheme } from '@/lib/guide-theme';

interface WeatherWidgetMiniProps {
    lat: number | null | undefined;
    lng: number | null | undefined;
    locationType?: 'coastal' | 'mountain' | 'urban';
    onClick?: () => void;
    themeId?: string;
}

export function WeatherWidgetMini({
    lat,
    lng,
    locationType = 'urban',
    onClick,
    themeId = 'modern_v2',
}: WeatherWidgetMiniProps) {
    const t = getGuideTheme(themeId);
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

    if (!lat || !lng) return null;

    // Skeleton mientras carga la primera vez
    if (isLoading && !weather) {
        return (
            <div className={cn("mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-2xl shadow-sm border px-4 py-3 flex items-center gap-3 animate-pulse", t.cardBg, t.searchBorder)}>
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

    // Formatear hora de última actualización: "12:59"
    const updatedStr = lastUpdated
        ? lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div className={cn("mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-2xl shadow-sm border px-4 py-3 flex flex-col gap-2.5 transition-colors", t.cardBg, t.searchBorder)}>
            {/* Fila principal — clickable si hay onClick */}
            <div
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
                onClick={onClick}
                onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
                className={cn(
                    'flex items-center gap-3',
                    onClick && 'cursor-pointer active:scale-[0.98] transition-transform'
                )}
            >
                {/* Icono condición */}
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", t.chipIconBg)}>
                    <span className="text-2xl leading-none">{icon}</span>
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-lg font-bold", t.guideCardTitle.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
                            {weather.currentTemp}°
                        </span>
                        <span className={cn("text-xs truncate", t.guideCardSubtitle)}>
                            {weather.contextual.primaryLine}
                        </span>
                    </div>
                    <p className={cn("text-[10px] truncate", t.sectionLabel)}>
                        {weather.contextual.secondaryLine}
                    </p>
                </div>

                {onClick && <ChevronRight className={cn("h-4 w-4 shrink-0", t.sectionLabel)} />}
            </div>

            {/* Fila inferior: última actualización + botón refresco */}
            <div className={cn("flex items-center justify-between pt-1 border-t", t.searchBorder)}>
                <span className={cn("text-[9px] font-medium", t.sectionLabel)}>
                    {updatedStr
                        ? `Actualizado · ${updatedStr}`
                        : 'Datos meteorológicos en tiempo real'}
                </span>

                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className={cn(
                        'flex items-center gap-1 text-[9px] font-semibold transition-colors px-1.5 py-0.5 rounded-lg active:scale-95',
                        t.sectionLabel,
                        (isRefreshing || isLoading) && 'opacity-40 cursor-not-allowed'
                    )}
                    aria-label="Actualizar datos del tiempo"
                >
                    <RefreshCw
                        className={cn(
                            'h-3 w-3',
                            (isRefreshing || isLoading) && 'animate-spin'
                        )}
                    />
                    <span>Actualizar</span>
                </button>
            </div>
        </div>
    );
}