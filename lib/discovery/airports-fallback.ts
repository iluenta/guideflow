/**
 * Fallback airport discovery when Wikidata fails
 * Uses a predefined list of major Spanish airports + distance calculation
 */

import { getDistanceMeters } from '../maps/overpass';

// Complete list of Spanish airports with IATA codes and coordinates
const SPANISH_AIRPORTS = [
    // ── Península - Centro ────────────────────────────────────────────────────
    { name: 'Adolfo Suárez Madrid-Barajas', code: 'MAD', city: 'Madrid', lat: 40.4719, lon: -3.5626 },
    { name: 'Madrid-Torrejón', code: 'TOJ', city: 'Madrid', lat: 40.4967, lon: -3.4458 },
    { name: 'Zaragoza', code: 'ZAZ', city: 'Zaragoza', lat: 41.6664, lon: -1.0274 },

    // ── Península - Norte ─────────────────────────────────────────────────────
    { name: 'Barcelona-El Prat', code: 'BCN', city: 'Barcelona', lat: 41.2971, lon: 2.0785 },
    { name: 'Bilbao', code: 'BIO', city: 'Bilbao', lat: 43.3011, lon: -2.9104 },
    { name: 'Santiago de Compostela', code: 'SCQ', city: 'Santiago', lat: 42.8967, lon: -8.4153 },
    { name: 'Asturias', code: 'OVD', city: 'Asturias', lat: 43.5636, lon: -6.0346 },
    { name: 'San Sebastián', code: 'EAS', city: 'San Sebastián', lat: 43.3565, lon: -1.7906 },
    { name: 'Santander', code: 'SDR', city: 'Santander', lat: 43.4271, lon: -3.8200 },
    { name: 'Pamplona', code: 'PNA', city: 'Pamplona', lat: 42.7700, lon: -1.6463 },
    { name: 'Vitoria-Gasteiz', code: 'VIT', city: 'Vitoria', lat: 42.8828, lon: -2.7245 },
    { name: 'A Coruña', code: 'LCG', city: 'A Coruña', lat: 43.3021, lon: -8.3776 },
    { name: 'Vigo', code: 'VGO', city: 'Vigo', lat: 42.2318, lon: -8.6268 },

    // ── Península - Levante ───────────────────────────────────────────────────
    { name: 'Valencia', code: 'VLC', city: 'Valencia', lat: 39.4893, lon: -0.4816 },
    { name: 'Alicante-Elche', code: 'ALC', city: 'Alicante', lat: 38.2822, lon: -0.5717 },
    { name: 'Murcia-Corvera', code: 'RMU', city: 'Murcia', lat: 37.8030, lon: -1.1253 },
    { name: 'Castellón-Costa Azahar', code: 'CDT', city: 'Castellón', lat: 40.2139, lon: 0.0731 },

    // ── Península - Sur ───────────────────────────────────────────────────────
    { name: 'Málaga-Costa del Sol', code: 'AGP', city: 'Málaga', lat: 36.6747, lon: -4.4991 },
    { name: 'Almería', code: 'LEI', city: 'Almería', lat: 36.8439, lon: -2.3701 },
    { name: 'Granada-Jaén', code: 'GRX', city: 'Granada', lat: 37.1887, lon: -3.7774 },
    { name: 'Sevilla', code: 'SVQ', city: 'Sevilla', lat: 37.4178, lon: -5.8931 },
    { name: 'Jerez de la Frontera', code: 'XRY', city: 'Jerez', lat: 36.7446, lon: -6.0601 },
    { name: 'Córdoba', code: 'ODB', city: 'Córdoba', lat: 37.8420, lon: -4.8488 },
    { name: 'Gibraltar', code: 'GIB', city: 'Gibraltar', lat: 36.1512, lon: -5.3497 },

    // ── Baleares ──────────────────────────────────────────────────────────────
    { name: 'Palma de Mallorca', code: 'PMI', city: 'Palma', lat: 39.5517, lon: 2.7389 },
    { name: 'Ibiza', code: 'IBZ', city: 'Ibiza', lat: 38.8729, lon: 1.3647 },
    { name: 'Menorca', code: 'MAH', city: 'Mahón', lat: 39.8629, lon: 4.2237 },

    // ── Canarias ──────────────────────────────────────────────────────────────
    { name: 'Tenerife Sur', code: 'TFS', city: 'Tenerife Sur', lat: 28.0445, lon: -16.5725 },
    { name: 'Tenerife Norte', code: 'TFN', city: 'Tenerife Norte', lat: 28.4827, lon: -16.3415 },
    { name: 'Gran Canaria', code: 'LPA', city: 'Las Palmas', lat: 27.9319, lon: -15.3866 },
    { name: 'Lanzarote', code: 'ACE', city: 'Arrecife', lat: 28.9455, lon: -13.6052 },
    { name: 'Fuerteventura', code: 'FUE', city: 'Puerto del Rosario', lat: 28.4527, lon: -13.8638 },
    { name: 'La Palma', code: 'SPC', city: 'Santa Cruz de la Palma', lat: 28.6265, lon: -17.7556 },
    { name: 'El Hierro', code: 'VDE', city: 'Valverde', lat: 27.8148, lon: -17.8871 },
    { name: 'La Gomera', code: 'GMZ', city: 'San Sebastián de la Gomera', lat: 28.0296, lon: -17.2146 },
];

export async function discoverNearbyAirportsFallback(coords: [number, number], radiusKm: number = 150) {
    const [lon, lat] = coords;

    try {
        const airportsWithDistance = SPANISH_AIRPORTS.map(airport => ({
            ...airport,
            distance_km: Math.round(getDistanceMeters(lat, lon, airport.lat, airport.lon) / 1000)
        }));

        const nearbyAirports = airportsWithDistance
            .filter(airport => airport.distance_km <= radiusKm)
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, 5);

        // If nothing found within radius, return closest anyway so Gemini always has context
        if (nearbyAirports.length === 0) {
            const closest = airportsWithDistance.sort((a, b) => a.distance_km - b.distance_km)[0];
            console.log(`[AIRPORTS-FALLBACK] No airports within ${radiusKm}km — returning closest: ${closest.name} (${closest.distance_km}km)`);
            return [closest];
        }

        console.log(`[AIRPORTS-FALLBACK] Found ${nearbyAirports.length} airports within ${radiusKm}km: ${nearbyAirports.map(a => `${a.code} (${a.distance_km}km)`).join(', ')}`);
        return nearbyAirports;

    } catch (error) {
        console.error('[AIRPORTS-FALLBACK] Error:', error);
        return [];
    }
}

export async function getClosestMajorAirport(coords: [number, number]) {
    const [lon, lat] = coords;

    try {
        const airportsWithDistance = SPANISH_AIRPORTS.map(airport => ({
            ...airport,
            distance_km: Math.round(getDistanceMeters(lat, lon, airport.lat, airport.lon) / 1000)
        }));

        return airportsWithDistance.sort((a, b) => a.distance_km - b.distance_km)[0];

    } catch (error) {
        console.error('[AIRPORTS-FALLBACK] Error getting closest airport:', error);
        return null;
    }
}