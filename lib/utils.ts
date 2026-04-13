import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates that a string is a valid UUID v4 format.
 * Returns false for semantic strings like "new", "", null, undefined.
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Returns the id if it is a valid UUID, otherwise null.
 * Prevents 22P02 errors from semantic strings like "new" or empty strings.
 */
export function sanitizeUUID(id: string | null | undefined): string | null {
  return isValidUUID(id) ? (id as string) : null
}

// ─── Geo helpers ──────────────────────────────────────────────────────────────
// Factor de corrección línea recta → distancia real caminando por calles
// (validado vs Google Maps en Madrid, valor 1.35 empiricamente probado)
const EARTH_RADIUS_M = 6_371_000;

/**
 * Distancia Haversine entre dos coordenadas, en metros (línea recta).
 * Para distancia caminando, multiplica por ~1.35.
 */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Distancia Haversine en kilómetros. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineMeters(lat1, lng1, lat2, lng2) / 1000;
}
