'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type WeatherCondition =
    | 'sunny'
    | 'partly-cloudy'
    | 'cloudy'
    | 'rain'
    | 'storm'
    | 'snow'
    | 'wind';

export interface HourlyForecast {
    hour: string;
    temp: number;
    condition: WeatherCondition;
    precipChance: number;
}

export interface ContextualDetail {
    label: string;
    value: string;
    icon: string;
}

export interface ContextualWeather {
    type: 'coastal' | 'mountain' | 'urban';
    primaryLine: string;
    secondaryLine: string;
    details: ContextualDetail[];
}

export interface WeatherData {
    currentTemp: number;
    feelsLike: number;
    condition: WeatherCondition;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    contextual: ContextualWeather;
    hourly: HourlyForecast[];
    alert: null;
}

export const CONDITION_ICONS: Record<WeatherCondition, string> = {
    sunny: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    storm: '⛈️',
    snow: '❄️',
    wind: '💨',
};

// ─── WMO code → condición ─────────────────────────────────────────────────────

function wmoToCondition(code: number): WeatherCondition {
    if (code === 0) return 'sunny';
    if (code <= 2) return 'partly-cloudy';
    if (code <= 3) return 'cloudy';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 95) return 'storm';
    return 'cloudy';
}

// ─── Líneas contextuales ──────────────────────────────────────────────────────

function buildContextual(
    condition: WeatherCondition,
    temp: number,
    humidity: number,
    windSpeed: number,
    uvIndex: number,
    locationType: 'coastal' | 'mountain' | 'urban'
): ContextualWeather {
    const uvLabel = uvIndex <= 2 ? 'Bajo' : uvIndex <= 5 ? 'Moderado' : uvIndex <= 7 ? 'Alto' : 'Muy alto';
    const windLabel = windSpeed < 20 ? 'Suave' : windSpeed < 40 ? 'Moderado' : 'Fuerte';

    const lines: Record<WeatherCondition, { primary: string; secondary: string }> = {
        sunny: { primary: `Día despejado · ${temp}° sensación`, secondary: `UV ${uvLabel} · Viento ${windLabel}` },
        'partly-cloudy': { primary: `Parcialmente nublado · ${temp}°`, secondary: `Humedad ${humidity}% · Viento ${windLabel}` },
        cloudy: { primary: `Cielo cubierto · ${temp}°`, secondary: `Humedad ${humidity}% · Viento ${windLabel}` },
        rain: { primary: `Lluvia · ${temp}°`, secondary: `Humedad ${humidity}% · Lleva paraguas` },
        storm: { primary: `Tormenta · ${temp}°`, secondary: `Precaución · Rayos posibles` },
        snow: { primary: `Nieve · ${temp}°`, secondary: `Carreteras cortadas posibles` },
        wind: { primary: `Viento fuerte · ${temp}°`, secondary: `Rachas de ${windSpeed} km/h` },
    };

    const { primary, secondary } = lines[condition];

    return {
        type: locationType,
        primaryLine: primary,
        secondaryLine: secondary,
        details: [
            { label: 'Sensación', value: `${temp}°C`, icon: '🌡️' },
            { label: 'Humedad', value: `${humidity}%`, icon: '💧' },
            { label: 'Viento', value: `${windSpeed} km/h`, icon: '💨' },
            { label: 'UV', value: `${uvLabel} (${uvIndex})`, icon: '☀️' },
        ],
    };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseWeatherOptions {
    lat: number | null | undefined;
    lng: number | null | undefined;
    locationType?: 'coastal' | 'mountain' | 'urban';
    /** Incrementar este valor fuerza un nuevo fetch ignorando la caché */
    refreshKey?: number;
    /** Callback que se invoca cuando el fetch completa con éxito */
    onFetched?: () => void;
}

interface UseWeatherResult {
    weather: WeatherData | null;
    isLoading: boolean;
    error: string | null;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

export function useWeather({
    lat,
    lng,
    locationType = 'urban',
    refreshKey = 0,
    onFetched,
}: UseWeatherOptions): UseWeatherResult {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ref para el callback para no incluirlo en las dependencias del effect
    const onFetchedRef = useRef(onFetched);
    onFetchedRef.current = onFetched;

    useEffect(() => {
        if (!lat || !lng) return;

        const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
        const forceRefresh = refreshKey > 0;

        // Intentar caché salvo que sea un refresco forzado
        if (!forceRefresh) {
            try {
                const raw = sessionStorage.getItem(cacheKey);
                if (raw) {
                    const { data, ts } = JSON.parse(raw);
                    if (Date.now() - ts < CACHE_TTL_MS) {
                        setWeather(data);
                        onFetchedRef.current?.();
                        return;
                    }
                }
            } catch { /* sessionStorage bloqueado */ }
        }

        const fetchWeather = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const url = new URL('https://api.open-meteo.com/v1/forecast');
                url.searchParams.set('latitude', String(lat));
                url.searchParams.set('longitude', String(lng));
                url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,uv_index');
                url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability');
                url.searchParams.set('forecast_days', '1');
                url.searchParams.set('timezone', 'auto');
                url.searchParams.set('wind_speed_unit', 'kmh');

                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
                const raw = await res.json();

                const c = raw.current;
                const currentTemp = Math.round(c.temperature_2m);
                const feelsLike = Math.round(c.apparent_temperature);
                const condition = wmoToCondition(c.weather_code);
                const humidity = Math.round(c.relative_humidity_2m);
                const windSpeed = Math.round(c.wind_speed_10m);
                const uvIndex = Math.round(c.uv_index ?? 0);

                const nowHour = new Date().getHours();
                const hourly: HourlyForecast[] = raw.hourly.time
                    .map((t: string, i: number) => ({
                        hour: t.slice(11, 16),
                        temp: Math.round(raw.hourly.temperature_2m[i]),
                        condition: wmoToCondition(raw.hourly.weather_code[i]),
                        precipChance: Math.round(raw.hourly.precipitation_probability[i] ?? 0),
                    }))
                    .filter((_: any, i: number) => {
                        const h = parseInt(raw.hourly.time[i].slice(11, 13), 10);
                        return h >= nowHour;
                    })
                    .slice(0, 10);

                const contextual = buildContextual(condition, currentTemp, humidity, windSpeed, uvIndex, locationType!);

                const data: WeatherData = {
                    currentTemp, feelsLike, condition, humidity,
                    windSpeed, uvIndex, contextual, hourly, alert: null,
                };

                setWeather(data);

                // Guardar en caché
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
                } catch { /* quota */ }

                onFetchedRef.current?.();

            } catch (err: any) {
                console.error('[useWeather]', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [lat, lng, locationType, refreshKey]);

    return { weather, isLoading, error };
}